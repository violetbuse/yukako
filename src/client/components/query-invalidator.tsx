import { useAuth } from "@clerk/clerk-react"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

export const QueryInvalidator = () => {
    const { isSignedIn, userId, orgId, orgRole } = useAuth()
    const queryClient = useQueryClient()

    useEffect(() => {
        queryClient.invalidateQueries()
    }, [isSignedIn, userId, orgId, orgRole])

    return <></>
}
