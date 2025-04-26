import type { RouterConfig } from "@/runtime/config";

type ServiceBinding = {
    fetch: (request: Request) => Promise<Response>;
}

type Environment = {
    map: Record<string, string>;
    backend: ServiceBinding;
    config: RouterConfig;
} & Record<string, ServiceBinding>;

export default {
    async fetch(request: Request, env: Environment) {
        const url = new URL(request.url);

        if (url.pathname === "/__yukako/router-startup-check") {
            return new Response("OK");
        }

        const hostname = url.hostname;

        if (!hostname) {
            return new Response("No hostname", { status: 400 });
        }

        const serve_backend_admin_ui = env.config.serve_admin;
        const hostname_matches_admin = env.config.admin_hostnames.includes(hostname);

        const path_unrestricted = !url.pathname.startsWith("/__yukako/");

        if (serve_backend_admin_ui && hostname_matches_admin && path_unrestricted) {
            return env.backend.fetch(request);
        }

        const worker_id = env.map[hostname];
        if (!worker_id) {
            return new Response("No worker id", { status: 404 });
        }

        const service = env[worker_id];
        if (!service) {
            return new Response("No service", { status: 404 });
        }

        const response = await service.fetch(request);

        try {
            await env.backend.fetch(new Request("http://localhost:3000/__yukako/traffic/" + worker_id, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: response.status.toString()
            }));
        } catch (error) {
            console.error(error);
        }

        return response;
    }
}
