import express from 'express';

const app = express();

app.get('/', async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, World!');
})

export class RuntimeBackend {
    private app: express.Application;

    constructor() {
        this.app = express();
    }

    public async start(): Promise<void> {
        this.app.listen(3000, () => {
            console.log('Server is running on port 3000');
        })
    }
}
