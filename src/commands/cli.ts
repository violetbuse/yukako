
import { Command } from 'commander';

const program = new Command();

program
    .name('yukako')
    .description('A CLI for the Yukako project')
    .version('1.0.0');

program
    .command('start')
    .description('Start the application')
    .action(() => {
        console.log('Starting the application...');
        // Logic to start the application
    });

program
    .command('build')
    .description('Build the application')
    .action(() => {
        console.log('Building the application...');
        // Logic to build the application
    });

program
    .command('dev')
    .description('Run the application in development mode')
    .action(() => {
        console.log('Running in development mode...');
        // Logic to run the application in development mode
    });

program.parse(process.argv);

