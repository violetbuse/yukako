import { Config as WorkerdConfig } from "../generated/workerd_types";
import { generateConfigBinary } from "./serialize";

export type Config = {}

export const build_config = (input: Config): WorkerdConfig => {
    return {
        services: [{
            name: "main",
            external: {
                address: "example.com:80",
                http: {}
            }
        }],
        sockets: [{
            name: "http",
            address: "*:8787",
            http: {},
            service: { name: "main" }
        }],
    }
}

export const serialize_config = (config: WorkerdConfig): Buffer => {
    return generateConfigBinary(config);
}
