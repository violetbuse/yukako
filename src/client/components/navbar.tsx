import { useTRPC } from "@/client/trpc_client"
import { useQuery } from "@tanstack/react-query";

export const Navbar = () => {
    const trpc = useTRPC();
    const self_query = useQuery(trpc.user.self.queryOptions())

    console.log(self_query.data);

    return (
        <div>
            <h1>Navbar</h1>
        </div>
    )
}
