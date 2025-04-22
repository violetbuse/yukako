import { StorageAdapter as OpenAuthStorageAdapter } from "@openauthjs/openauth/storage/storage";
import { redis } from "@/redis"

export class AuthStorageAdapter implements OpenAuthStorageAdapter {

    constructor() { }

    private getKey(key: string[]): string {
        return "yukako-openauth-kv:" + key.join(":");
    }

    private decodeKey(key: string): string[] {
        const [_, ...rest] = key.split(":");
        return rest;
    }

    async get(key: string[]): Promise<Record<string, any> | undefined> {
        const value = await redis.get(this.getKey(key));
        if (!value) return undefined;
        return JSON.parse(value);
    }

    async set(key: string[], value: any, expiry?: Date): Promise<void> {
        const ttl = expiry ? Math.floor((expiry.getTime() - Date.now()) / 1000) : undefined;
        if (ttl) {
            await redis.set(this.getKey(key), JSON.stringify(value), "EX", ttl);
        } else {
            await redis.set(this.getKey(key), JSON.stringify(value));
        }
    }

    async remove(key: string[]): Promise<void> {
        await redis.del(this.getKey(key));
    }

    async *scan(prefix: string[]): AsyncIterable<[string[], any]> {
        const pattern = this.getKey(prefix) + "*";
        const stream = redis.scanStream({
            match: pattern,
        });

        for await (const key of stream) {
            yield [this.decodeKey(key), await redis.get(key)];
        }
    }

}
