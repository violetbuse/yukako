#!/usr/bin/env node

// import devCommand from '@/commands/dev';
import { Command } from 'commander';
import loginCommand from '@/commands/login';
import whoamiCommand from '@/commands/whoami';
import logoutCommand from '@/commands/logout';
import startCommand from '@/commands/start';

const program = new Command();

program
    .name('yukako')
    .description('A CLI for the Yukako project')
    .version('1.0.0');

// program.addCommand(devCommand);
program.addCommand(startCommand);
program.addCommand(loginCommand);
program.addCommand(whoamiCommand);
program.addCommand(logoutCommand);

program.parse(process.argv);

