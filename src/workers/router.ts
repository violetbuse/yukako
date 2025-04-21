
type ServiceBinding = {
    fetch: (request: Request) => Promise<Response>;
}

type Environment = {
    map: Record<string, string>;
} & Record<string, ServiceBinding>;

export default {
    async fetch(request: Request, env: Environment) {
        const url = new URL(request.url);

        if (url.pathname === "/__yukako/startup-check") {
            return new Response("OK");
        }

        const hostname = url.hostname;

        if (!hostname) {
            return new Response("No hostname", { status: 400 });
        }

        const worker_id = env.map[hostname];
        if (!worker_id) {
            return new Response("No worker id", { status: 404 });
        }

        const service = env[worker_id];
        if (!service) {
            return new Response("No service", { status: 404 });
        }

        return service.fetch(request);
    }
}
