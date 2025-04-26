import { Command } from 'commander';
import { create_localhost_server } from './lib/auth/server';
import { set_auth_token } from './lib/config';
import { cli_yukako_url } from '@/commands/invariants';
import { whoami } from '@/commands/lib/auth/whoami';
// import open from 'open';

const loginCommand = new Command('login')
    .description('Authenticate and login to Yukako')
    .action(async () => {
        try {
            const { authenticate_url, listen_for_auth_redirect, verification_code } = await create_localhost_server();

            console.log(`Please authenticate by visiting: ${authenticate_url}`);
            console.log(`Verification code: ${verification_code}`);

            // console.log('Opening browser...');
            // await open(authenticate_url);

            const authCode = await listen_for_auth_redirect();
            // console.log(`Authentication successful! Code: ${authCode}`);

            set_auth_token(authCode);

            const auth_info = await whoami();

            if (!auth_info) {
                console.error('Failed to authenticate');
                return;
            }

            console.log(`Logged in as ${auth_info.user.username ?? auth_info.user.email} (id:${auth_info.user.id})`);

            if (auth_info.org) {
                console.log(`Organization: ${auth_info.org.name} (${auth_info.org.slug})`);
            } else {
                console.log('Logged in as personal');
            }

        } catch (error) {
            console.error('Failed to authenticate:', error);
        }
    });

export default loginCommand;
