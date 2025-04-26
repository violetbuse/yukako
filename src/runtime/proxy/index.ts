import { ConfigManager } from "@/runtime/config/manager";
import http_proxy from "http-proxy";
import http from "http";

export class Proxy {
    private static instance: Proxy;

    private server: http.Server | null = null;

    private constructor() {

    }

    public static getInstance(): Proxy {
        if (!Proxy.instance) {
            Proxy.instance = new Proxy();
        }
        return Proxy.instance;
    }

    public async start(): Promise<void> {
        if (this.server) {
            this.server.close();
            this.server = null;
        }

        const config = ConfigManager.getInstance().get_config();

        const proxy = http_proxy.createProxyServer({
            // @ts-ignore
            target: {
                socketPath: config.workerd_socket
            },
            ws: true
        });

        this.server = http.createServer((req, res) => {
            proxy.web(req, res);
        });

        this.server.listen(config.port, () => {
            console.log(`Yukako being served at http://localhost:${config.port}`);
        });
    }

    public async stop(): Promise<void> {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
}
