import { value } from "./export"

export default {
    async fetch(request: Request) {
        return new Response(value);
    }
}