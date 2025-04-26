import { get_auth_token } from "@/commands/lib/config";
import { cli_yukako_url } from "@/commands/invariants";
import { z } from "zod";

const schema = z.object({
    user: z.object({
        id: z.string(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        username: z.string().nullable(),
    }),
    org: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
    }).nullable(),
});

export const whoami = async () => {
    const token = get_auth_token();
    if (!token) {
        return null;
    }

    const res = await fetch(`${cli_yukako_url}/api/cli/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const data = await res.json();

    try {
        const parsed = schema.parse(data);
        return parsed;
    } catch (error) {
        console.error(error);
        return null;
    }
}
