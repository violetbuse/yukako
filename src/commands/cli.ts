#!/usr/bin/env node

import { Command } from 'commander';
import loginCommand from '@/commands/auth/login';
import whoamiCommand from '@/commands/auth/whoami';
import logoutCommand from '@/commands/auth/logout';
import buildCommand from '@/commands/source/build';
import serveCommand from '@/commands/source/serve';
import uploadCommand from '@/commands/source/upload';

const program = new Command();

program
    .name('yukako')
    .description('A CLI for the Yukako project')
    .version('1.0.0');

program.addCommand(loginCommand);
program.addCommand(whoamiCommand);
program.addCommand(logoutCommand);
program.addCommand(buildCommand);
program.addCommand(serveCommand);
program.addCommand(uploadCommand);

program.parse(process.argv);

