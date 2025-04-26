import { Command } from 'commander';
import { clear_auth_token } from './lib/config';

const logoutCommand = new Command('logout')
    .description('Logout from Yukako')
    .action(() => {
        try {
            clear_auth_token();
            console.log('Successfully logged out.');
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    });

export default logoutCommand;
