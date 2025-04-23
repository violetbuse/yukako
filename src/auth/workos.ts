import { User, WorkOS } from "@workos-inc/node";
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
            organization_id: string | null | undefined;
        }
    }
}

export const with_auth = async (req: Request, res: Response, next: NextFunction) => {
    const sealed_session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'],
        cookiePassword: WORKOS_COOKIE_PASSWORD,
    });

    const session = await sealed_session.authenticate();

    if (session.authenticated) {
        req.user = session.user;
        req.organization_id = session.organizationId;
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
        req.organization_id = session.organizationId;
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
        sessionData: req.cookies['wos-session'],
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
