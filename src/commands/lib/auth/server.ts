import express from 'express';
import portfinder from 'portfinder';
import { cli_yukako_url } from '@/commands/invariants';

const SUCCESS_PAGE = `
<html>
    <body>
        <h1>Authenticated successfully</h1>
        <p>You can now close this page</p>
    </body>
</html>
`

export const create_localhost_server = async () => {
    const app = express();

    const port = await portfinder.getPortPromise();

    const redirect_url = `http://localhost:${port}/callback`;
    const authenticate_url = `http://localhost:${port}/authenticate`;

    const verification_code = Math.floor(100000 + Math.random() * 900000);

    const listen_for_auth_redirect = () => {
        return new Promise((resolve, reject) => {
            const server = app.listen(port);

            app.get('/authenticate', (req, res) => {
                const search_params = new URLSearchParams();
                search_params.set('redirect', redirect_url);
                search_params.set('code', verification_code.toString());
                res.redirect(`${cli_yukako_url}/auth/cli?${search_params.toString()}`);
            })

            app.get('/callback', (req, res) => {
                if (req.query.code && typeof req.query.code === 'string') {
                    resolve(req.query.code);
                    res.status(200).setHeader('Content-Type', 'text/html').send(SUCCESS_PAGE);
                } else {
                    reject(new Error('No code provided'));
                    res.status(400).send('No code provided');
                }

                setTimeout(() => {
                    server.close();
                }, 1000);
            })
        }) as Promise<string>
    }

    return {
        authenticate_url,
        listen_for_auth_redirect,
        verification_code
    }
}

