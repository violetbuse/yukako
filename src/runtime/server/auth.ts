import { save_sealed_session, sync_user, workos, WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD, WORKOS_WEBHOOK_SECRET } from "@/auth/workos";
import { db } from "@/db";
import { organization_memberships, organizations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get('/login', (req, res) => {
    const host = req.headers.host;
    const protocol = req.protocol;
    const redirect_uri = `${protocol}://${host}/api/auth/callback`;

    console.log("redirect_uri", redirect_uri);

    const auth_url = workos.userManagement.getAuthorizationUrl({
        provider: 'authkit',
        redirectUri: redirect_uri,
        clientId: WORKOS_CLIENT_ID,
    });

    res.redirect(auth_url);
})

router.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        res.status(400).json({ error: 'No code provided' });
        return;
    }

    const { user, sealedSession } = await workos.userManagement.authenticateWithCode({
        code: code as string,
        clientId: WORKOS_CLIENT_ID,
        session: {
            sealSession: true,
            cookiePassword: WORKOS_COOKIE_PASSWORD,
        }
    });

    await sync_user(user.id);

    if (!user || !sealedSession) {
        res.redirect('/api/auth/login');
        return;
    }

    save_sealed_session(sealedSession, res);
    res.redirect('/');
})

router.get('/logout', async (req, res) => {
    const session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'],
        cookiePassword: WORKOS_COOKIE_PASSWORD,
    });

    const url = await session.getLogoutUrl({
        returnTo: `${req.protocol}://${req.headers.host}/`,
    });

    res.clearCookie('wos-session');
    res.redirect(url);
})

router.post('/webhook', async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const body = req.body;

    const signature = req.headers['workos-signature'];

    if (!signature) {
        res.status(400).json({ error: 'No signature provided' });
        return;
    }

    const webhook = await workos.webhooks.constructEvent({
        payload: body,
        sigHeader: signature as string,
        secret: WORKOS_WEBHOOK_SECRET,
    });

    console.log("webhook received", JSON.stringify(webhook, null, 2));

    switch (webhook.event) {
        case 'organization.created':
        case 'organization.updated':
        case 'organization.deleted': {
            const org = webhook.data;
            try {
                if (webhook.event !== 'organization.deleted') {
                    const workos_org = await workos.organizations.getOrganization(org.id);
                    const name = workos_org.name;
                    const orgExists = await db.query.organizations.findFirst({
                        where: eq(organizations.id, org.id)
                    });

                    if (orgExists) {
                        // Update existing organization
                        await db.update(organizations)
                            .set({
                                name: name,
                                updated_at: new Date()
                            })
                            .where(eq(organizations.id, org.id));
                    } else {
                        // Create new organization
                        await db.insert(organizations).values({
                            id: org.id,
                            name: name,
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    }
                } else {
                    await db.update(organizations)
                        .set({
                            deleted_at: new Date()
                        })
                        .where(eq(organizations.id, org.id));
                }
            } catch (error) {
                console.error("error", error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            break;
        }
        case 'user.created':
        case 'user.updated':
        case 'user.deleted': {
            const user = webhook.data;
            try {
                if (webhook.event !== 'user.deleted') {
                    const workos_user = await workos.userManagement.getUser(user.id);
                    const email = workos_user.email;
                    const userExists = await db.query.users.findFirst({
                        where: eq(users.id, user.id)
                    });

                    if (userExists) {
                        // Update existing user
                        await db.update(users)
                            .set({
                                email: email,
                                updated_at: new Date()
                            })
                            .where(eq(users.id, user.id));
                    } else {
                        // Create new user
                        await db.insert(users).values({
                            id: user.id,
                            email: email,
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    }
                } else {
                    await db.update(users)
                        .set({
                            deleted_at: new Date()
                        })
                        .where(eq(users.id, user.id));
                }
            } catch (error) {
                console.error("error", error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            break;
        }
        case 'organization_membership.created':
        case 'organization_membership.updated':
        case 'organization_membership.deleted': {
            const org_membership = webhook.data;
            try {
                if (webhook.event !== 'organization_membership.deleted') {
                    const workos_org_membership = await workos.userManagement.getOrganizationMembership(org_membership.id);
                    const user_id = workos_org_membership.userId;
                    const organization_id = workos_org_membership.organizationId;
                    const role_slug = workos_org_membership.role.slug;
                    const status = workos_org_membership.status;

                    const orgMembershipExists = await db.query.organization_memberships.findFirst({
                        where: eq(organization_memberships.id, org_membership.id)
                    });

                    if (orgMembershipExists) {
                        // Update existing organization membership
                        await db.update(organization_memberships)
                            .set({
                                user_id: user_id,
                                organization_id: organization_id,
                                role_slug: role_slug,
                                status: status,
                                updated_at: new Date()
                            })
                            .where(eq(organization_memberships.id, org_membership.id));
                    } else {
                        // Create new organization membership
                        await db.insert(organization_memberships).values({
                            id: org_membership.id,
                            user_id: user_id,
                            organization_id: organization_id,
                            role_slug: role_slug,
                            status: status,
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    }
                } else {
                    // Handle deletion of organization membership
                    await db.update(organization_memberships)
                        .set({
                            deleted_at: new Date()
                        })
                        .where(eq(organization_memberships.id, org_membership.id));
                }
            } catch (error) {
                console.error("error", error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            break;
        }
        case 'role.created':
        case 'role.updated':
        case 'role.deleted': {
            const role = webhook.data;
            break;
        }
    }

    res.status(200).json({ message: 'Webhook received' });
})


export const auth_router = router;
