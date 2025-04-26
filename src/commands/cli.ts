#!/usr/bin/env node

import devCommand from '@/commands/dev';
import { Command } from 'commander';

const program = new Command();

program
    .name('yukako')
    .description('A CLI for the Yukako project')
    .version('1.0.0');

program.addCommand(devCommand);

program.parse(process.argv);

