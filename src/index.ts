import 'dotenv/config';
import serveCommand from '@/commands/serve';

import { Command } from 'commander';

const program = new Command();

program
    .name('yukako')
    .description('CLI for managing the Yukako runtime')
    .version('1.0.0');

program.addCommand(serveCommand);

program.parse(process.argv);

