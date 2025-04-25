import { Button } from "@/client/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/client/components/ui/dialog"
import { AdminLayout } from "@/client/layouts/admin"
import { useTRPC } from "@/client/trpc_client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { X, Check, Plus } from "lucide-react"
import { Input } from "@/client/components/ui/input"
import { useState } from "react"
import { TRPCError } from "@trpc/server"
import { toast } from "sonner"

export const AdminHostnames = () => {

    const trpc = useTRPC()
    const { data, isLoading, error, refetch } = useQuery(trpc.workers.get_hostnames.queryOptions())

    const verify_mutation = useMutation(trpc.workers.attempt_verify_hostname.mutationOptions({
        onSuccess: (data) => {
            refetch()
            if (data.verified) {
                toast.success("Hostname verified successfully")
            } else {
                toast.error("Hostname verification failed, please check your DNS records or try again later.")
            }
        }
    }))

    return (
        <AdminLayout>
            <h1 className="text-xl font-bold">Domains & Hostnames</h1>
            <div className="flex flex-col gap-2 mt-2">
                {data?.map((hostname) => (
                    <div key={hostname.hostname} className="flex flex-col gap-2 bg-accent p-4 rounded-md">
                        <p>{hostname.hostname}</p>
                        <p className="flex items-center gap-2">
                            {!hostname.verified && <>
                                <X className="w-4 h-4 text-red-500" />
                                <p className="text-red-500">Not verified</p>
                            </>}
                            {hostname.verified && <>
                                <Check className="w-4 h-4 text-green-500" />
                                <p className="text-green-500">Verified</p>
                            </>}
                        </p>
                        {!hostname.verified && <p className="text-sm bg-background p-2 rounded-sm">
                            To verify this hostname, please add the following entry to your DNS records: <br />
                            <code className="bg-muted p-1 rounded-md">TXT {hostname.verification_entry} = {hostname.verification_code}</code> <br />
                            <p>
                                This will allow us to verify that you own this hostname. Please press the button below to verify it.
                            </p>
                        </p>}
                        {!hostname.verified && <Button className="w-fit" onClick={() => verify_mutation.mutate({
                            hostname_id: hostname.id
                        })}>Verify</Button>}
                    </div>
                ))}
                <CreateHostnameDialog />
                {data?.length === 0 && <p className="text-sm text-muted-foreground">No hostnames found</p>}
            </div>
        </AdminLayout>
    )
}

export const CreateHostnameDialog = () => {

    const [isOpen, setIsOpen] = useState(false)

    const trpc = useTRPC()
    const { refetch } = useQuery(trpc.workers.get_hostnames.queryOptions())
    const mutate = useMutation(trpc.workers.create_hostname.mutationOptions({
        onSuccess: () => {
            refetch()
            toast.success("Hostname created successfully")
            setIsOpen(false)
            setHostname("")
            setError(null)
            setIsLoading(false)
        }
    }))

    const [hostname, setHostname] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const create_hostname = (hostname: string) => {
        try {
            setIsLoading(true)
            mutate.mutate({ hostname })
        } catch (error) {
            if (error instanceof TRPCError) {
                setError(error.message)
            } else if (error instanceof Error) {
                setError(error.message)
            } else {
                setError("An unknown error occurred")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-fit">
                    <Plus className="w-4 h-4" />
                    Create Hostname
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Hostname</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    Please enter the hostname you want to create.
                    <Input type="text" placeholder="Hostname" value={hostname} onChange={(e) => setHostname(e.target.value)} />
                    <Button className="w-fit mt-2" onClick={() => create_hostname(hostname)}>Create</Button>
                    {isLoading && <p>Creating...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                </DialogDescription>
            </DialogContent>
        </Dialog>
    )
}       