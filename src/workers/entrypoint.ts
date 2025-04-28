// @ts-ignore
import entrypoint from "./script";

type Environment = {} & Record<string, any>;

type ExecutionContext = {
    waitUntil: (promise: Promise<any>) => void;
}

export default {
    async fetch(request: Request, env: Environment, ctx: ExecutionContext) {
        return entrypoint.fetch(request, env, ctx);
    }
}
