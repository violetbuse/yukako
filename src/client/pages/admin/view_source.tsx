import { AdminLayout } from "@/client/layouts/admin"
import { useTRPC } from "@/client/trpc_client"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "wouter"
import { useLocation } from "wouter"

export const AdminCodeSource = () => {

    const trpc = useTRPC()
    const { data } = useQuery(trpc.workers.get_source.queryOptions())

    const params = useParams()
    const worker_id = params[0];

    const [, navigate] = useLocation()

    if (!worker_id) {
        navigate('/admin')
        return null
    }

    const worker_script = data?.find(w => w.id === worker_id)?.content;

    return (
        <AdminLayout>
            {!worker_script ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="text-2xl font-bold">Worker script not found</h1>
                </div>
            ) : (
                <pre className="text-sm">{worker_script}</pre>
            )}
        </AdminLayout>
    )
}
