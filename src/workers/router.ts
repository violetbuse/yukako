
type ServiceBinding = {
    fetch: (request: Request) => Promise<Response>;
}

type Environment = {
    map: Record<string, string>;
} & Record<string, ServiceBinding>;

export default {
    async fetch(request: Request, env: Environment) {
        const host = request.headers.get("host");
        const hostname = host?.split(":")[0];

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
