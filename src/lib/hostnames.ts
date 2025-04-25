import { db } from "@/db"
import { TRPCError } from "@trpc/server"
import { hostnames } from "@/db/schema"
import { and, not, eq } from "drizzle-orm"
import Dns2 from "dns2"

export const generate_verification_entry = (hostname: string) => {
    return `yukako-verification.${hostname}`
}

export const verify_hostname = async (hostname_id: string): Promise<{ verified: boolean }> => {
    try {
        const hostname = await db.query.hostnames.findFirst({
            where: eq(hostnames.id, hostname_id)
        })

        if (!hostname) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Hostname not found" })
        }

        if (hostname.verified) {
            return {
                verified: true
            }
        }

        const verification_entry = generate_verification_entry(hostname.hostname)

        const dns_client = new Dns2({
            nameServers: ["1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4"]
        })

        const resolved_entry = await dns_client.query(verification_entry, "TXT")

        const answers_matching_entry = resolved_entry.answers.filter((answer) => answer.name === verification_entry)
        const answers_matching_code = answers_matching_entry.filter((answer) => answer.data?.trim() === hostname.verification_code)

        const is_verified = answers_matching_code.length > 0
        const no_answers_matching_entry = answers_matching_entry.length === 0

        if (is_verified) {
            await db.transaction(async (tx) => {
                // set all other hostnames with the same hostname to not verified
                await tx.update(hostnames).set({ verified: false }).where(
                    and(
                        not(eq(hostnames.id, hostname_id)),
                        eq(hostnames.hostname, hostname.hostname)
                    )
                )
                // set the hostname to verified
                await tx.update(hostnames).set({ verified: true }).where(eq(hostnames.id, hostname_id))
            })
        } else if (no_answers_matching_entry) {
            // if there are no answers matching the entry, we un-verify all hostnames with the same hostname
            await db.update(hostnames).set({ verified: false }).where(eq(hostnames.hostname, hostname.hostname))
        }

        return {
            verified: is_verified
        }
    } catch (error) {
        console.error(error)
        return { verified: false }
    }
}
