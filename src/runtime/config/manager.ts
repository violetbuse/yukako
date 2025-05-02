import { Config } from "@/runtime/config";
import { nanoid } from "nanoid";
import { tmpdir } from "os";
import { join } from "path";
import _ from "lodash";

export class ConfigManager {
    private static instance: ConfigManager;
    private config: Config;
    private update_notify_listeners: (() => void)[] = [];

    private constructor(config: Config) {
        this.config = config;
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            const backend_socket = join(tmpdir(), `yukako_backend_${nanoid()}.sock`);
            const workerd_socket = join(tmpdir(), `yukako_workerd_${nanoid()}.sock`);
            const poll_interval = parseInt(process.env.POLL_INTERVAL || "10000");

            const config: Config = {
                port: 8787,
                backend_socket,
                workerd_socket,
                poll_interval,
                worker_update_throttle_interval: 10_000,
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

    private notify_listeners() {
        this.update_notify_listeners.forEach(listener => listener());
    }

    private debounce_interval = 1000;
    private debounced_notify_listeners = _.debounce(() => this.notify_listeners(), this.debounce_interval, { maxWait: this.debounce_interval, trailing: true, leading: true });

    public update_config(config: Config) {
        this.config = config;

        if (config.worker_update_throttle_interval !== this.debounce_interval) {
            this.debounced_notify_listeners.cancel();

            this.debounce_interval = config.worker_update_throttle_interval;
            this.debounced_notify_listeners = _.debounce(() => this.notify_listeners(), this.debounce_interval, { maxWait: this.debounce_interval, trailing: true, leading: true });
        }

        this.debounced_notify_listeners();
    }

    public get_config(): Config {
        return this.config;
    }
}