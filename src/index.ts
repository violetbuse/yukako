import dotenv from 'dotenv';

dotenv.config();

const main = () => {
    console.log('Hello, TypeScript!');
    console.log('Environment:', process.env.NODE_ENV || 'development');
};

main(); 