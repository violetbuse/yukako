import { z } from "zod"
import Conf from "conf"

const config_schema = z.object({
    worker_id: z.string(),
    compatibility_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    script: z.string(),
})

export const parse_config_file = (value: string) => {
    try {
        const json = JSON.parse(value);
        const config = config_schema.parse(json);
        return config;
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export const conf_instance = new Conf({
    projectName: "yukako-cli",
})

export const get_auth_token = () => {
    const token = conf_instance.get("auth_token");
    if (!token) {
        return null;
    }
    return token;
}

export const set_auth_token = (token: string) => {
    conf_instance.set("auth_token", token);
}

export const clear_auth_token = () => {
    conf_instance.delete("auth_token");
}
