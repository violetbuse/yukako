import { Command } from 'commander';
import { whoami } from '../lib/auth/whoami';

const whoamiCommand = new Command('whoami')
    .description('Display the current authenticated user information')
    .action(async () => {
        try {
            const auth_info = await whoami();

            if (!auth_info) {
                console.error('No authenticated user found. Please login with `yukako login`');
                return;
            }

            console.log(`User: ${auth_info.user.username ?? auth_info.user.email} (id:${auth_info.user.id})`);

            if (auth_info.org) {
                console.log(`Organization: ${auth_info.org.name} (${auth_info.org.slug})`);
            } else {
                console.log('No organization associated, logged in as personal.');
            }

        } catch (error) {
            console.error('Failed to retrieve user information:', error);
        }
    });

export default whoamiCommand;
