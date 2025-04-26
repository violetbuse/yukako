import { z } from "zod"

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
