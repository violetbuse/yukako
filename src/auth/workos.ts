import { db } from "@/db";
import { organization_memberships, organizations, users } from "@/db/schema";
import { User, WorkOS } from "@workos-inc/node";
import { and, eq, isNull } from "drizzle-orm";
import { Response, Request, NextFunction } from "express";

export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID!;
export const WORKOS_API_KEY = process.env.WORKOS_API_KEY!;
export const WORKOS_COOKIE_PASSWORD = process.env.WORKOS_COOKIE_PASSWORD!;
export const WORKOS_WEBHOOK_SECRET = process.env.WORKOS_WEBHOOK_SECRET!;

export const workos = new WorkOS(WORKOS_API_KEY, {
    clientId: WORKOS_CLIENT_ID,
});

export const save_sealed_session = async (session: string, res: Response) => {
    res.cookie('wos-session', session, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    })
}

declare global {
    namespace Express {
        interface Request {
            user: User | null | undefined;
            organization_ids: string[] | null | undefined;
        }
    }
}

export const with_auth = async (req: Request, res: Response, next: NextFunction) => {
    const sealed_session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'] ?? '',
        cookiePassword: WORKOS_COOKIE_PASSWORD,
    });

    const session = await sealed_session.authenticate();

    if (session.authenticated) {
        req.user = session.user;

        const organizations = await db.query.organization_memberships.findMany({
            where: and(
                eq(organization_memberships.user_id, session.user.id),
                isNull(organization_memberships.deleted_at)
            ),
        });

        req.organization_ids = organizations.map((organization) => organization.organization_id);

        next();
        return;
    }

    if (!session.authenticated && session.reason === 'no_session_cookie_provided') {
        res.redirect('/api/auth/login');
        return;
    }

    try {
        const session = await sealed_session.refresh();

        if (!session.authenticated) {
            res.redirect('/api/auth/login');
            return;
        }

        if (session.sealedSession) {
            save_sealed_session(session.sealedSession, res);
        }

        req.user = session.user;

        const organizations = await db.query.organization_memberships.findMany({
            where: and(
                eq(organization_memberships.user_id, session.user.id),
                isNull(organization_memberships.deleted_at)
            ),
        });

        req.organization_ids = organizations.map((organization) => organization.organization_id);

        next();
        return;
    } catch (error) {
        console.error(error);
        res.redirect('/api/auth/login');
        return;
    }
}

export const trpc_context_auth = async (req: Request, res: Response): Promise<User | null> => {
    const sealed_session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'] ?? '',
        cookiePassword: WORKOS_COOKIE_PASSWORD,
    });

    const session = await sealed_session.authenticate();

    if (session.authenticated) {
        return session.user;
    }

    if (!session.authenticated && session.reason === 'no_session_cookie_provided') {
        return null;
    }

    try {
        const session = await sealed_session.refresh();

        if (!session.authenticated) {
            return null;
        }

        if (session.sealedSession) {
            save_sealed_session(session.sealedSession, res);
        }

        return session.user;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const sync_user = async (user_id: string) => {
    const workos_user = await workos.userManagement.getUser(user_id);

    const db_user = await db.query.users.findFirst({
        where: eq(users.id, user_id)
    });

    if (!db_user) {
        await db.insert(users).values({
            id: user_id,
            email: workos_user.email,
        });
    } else {
        await db.update(users).set({
            email: workos_user.email,
        }).where(eq(users.id, user_id));
    }

    const organization_memberships_paginate = await workos.userManagement.listOrganizationMemberships({ userId: user_id });
    const memberships = await organization_memberships_paginate.autoPagination();

    await Promise.all(memberships.map(async (membership) => {
        try {
            const existing_membership = await db.query.organization_memberships.findFirst({
                where: eq(organization_memberships.id, membership.id)
            });

            if (!existing_membership) {
                await db.insert(organization_memberships).values({
                    id: membership.id,
                    user_id: user_id,
                    organization_id: membership.organizationId,
                    role_slug: membership.role.slug,
                    status: membership.status,
                    created_at: new Date(membership.createdAt),
                    updated_at: new Date(membership.updatedAt),
                });
            } else {
                await db.update(organization_memberships).set({
                    role_slug: membership.role.slug,
                    status: membership.status,
                    updated_at: new Date(membership.updatedAt),
                }).where(eq(organization_memberships.id, membership.id));
            }

            const organization = await workos.organizations.getOrganization(membership.organizationId);

            const existing_organization = await db.query.organizations.findFirst({
                where: eq(organizations.id, organization.id)
            });

            if (!existing_organization) {
                await db.insert(organizations).values({
                    id: organization.id,
                    name: organization.name,
                    created_at: new Date(organization.createdAt),
                    updated_at: new Date(organization.updatedAt),
                });
            } else {
                await db.update(organizations).set({
                    name: organization.name,
                    updated_at: new Date(organization.updatedAt),
                }).where(eq(organizations.id, organization.id));
            }
        } catch (error) {
            console.error(error);
        }
    }));
}

export const sync_organization = async (organization_id: string) => {
    const workos_organization = await workos.organizations.getOrganization(organization_id);

    const db_organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organization_id)
    });

    if (!db_organization) {
        await db.insert(organizations).values({
            id: organization_id,
            name: workos_organization.name,
            created_at: new Date(workos_organization.createdAt),
            updated_at: new Date(workos_organization.updatedAt),
        });
    } else {
        await db.update(organizations).set({
            name: workos_organization.name,
        }).where(eq(organizations.id, organization_id));
    }

    const organization_memberships_paginate = await workos.userManagement.listOrganizationMemberships({ organizationId: organization_id });
    const memberships = await organization_memberships_paginate.autoPagination();
    await Promise.all(memberships.map(async (membership) => {
        try {
            const existing_membership = await db.query.organization_memberships.findFirst({
                where: eq(organization_memberships.id, membership.id)
            });

            if (!existing_membership) {
                await db.insert(organization_memberships).values({
                    id: membership.id,
                    user_id: membership.userId,
                    organization_id: organization_id,
                    role_slug: membership.role.slug,
                    status: membership.status,
                    created_at: new Date(membership.createdAt),
                    updated_at: new Date(membership.updatedAt),
                });
            } else {
                await db.update(organization_memberships).set({
                    role_slug: membership.role.slug,
                }).where(eq(organization_memberships.id, membership.id));
            }

            const user = await workos.userManagement.getUser(membership.userId);

            const existing_user = await db.query.users.findFirst({
                where: eq(users.id, user.id)
            });

            if (!existing_user) {
                await db.insert(users).values({
                    id: user.id,
                    email: user.email,
                });
            } else {
                await db.update(users).set({
                    email: user.email,
                }).where(eq(users.id, user.id));
            }
        } catch (error) {
            console.error(error);
        }
    }));
}
