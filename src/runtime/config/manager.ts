import { Config } from "@/runtime/config";
import { nanoid } from "nanoid";
import { tmpdir } from "os";
import { join } from "path";

export class ConfigManager {
    private static instance: ConfigManager;
    private config: Config;
    private update_notify_listeners: (() => void)[] = [];

    private constructor(config: Config) {
        this.config = config;
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            const workerd_port = parseInt(process.env.WORKERD_PORT || "8787");
            const backend_socket = join(tmpdir(), `yukako_backend_${nanoid()}.sock`);

            const poll_interval = parseInt(process.env.POLL_INTERVAL || "10000");

            const config = {
                workerd_port,
                backend_socket,
                poll_interval,
                router_config: {
                    serve_admin: true,
                    admin_hostnames: ["localhost", "yukako.com"],
                    track_traffic: true
                },
                workers: []
            }

            ConfigManager.instance = new ConfigManager(config);
        }
        return ConfigManager.instance;
    }

    public subscribe(listener: () => void) {
        this.update_notify_listeners.push(listener);
    }

    public unsubscribe(listener: () => void) {
        this.update_notify_listeners = this.update_notify_listeners.filter(l => l !== listener);
    }

    public update_config(config: Config) {
        this.config = config;
        this.update_notify_listeners.forEach(listener => listener());
    }

    public get_config(): Config {
        return this.config;
    }
}