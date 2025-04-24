import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/client/components/ui/dropdown-menu";
import { Button } from "@/client/components/ui/button";
import { useTRPC } from "@/client/trpc_client"
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/client/components/ui/dialog";
import { Input } from "@/client/components/ui/input";
import { TRPCError } from "@trpc/server";
import { ChevronDown, Plus } from "lucide-react";

export const WorkerSwitcher = () => {

    const trpc = useTRPC();
    const workers = useQuery(trpc.workers.list.queryOptions())

    const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
    const { selected_worker_id, selected_worker_name } = useMemo(() => {
        const selected_worker_id = selectedWorker ? workers.data?.find((worker) => worker.id === selectedWorker)?.id : null;
        const selected_worker_name = selectedWorker ? workers.data?.find((worker) => worker.id === selectedWorker)?.name : null;
        return { selected_worker_id, selected_worker_name }
    }, [selectedWorker, workers.data]);

    console.log({ data: workers.data })

    const [isNewWorkerModalOpen, setIsNewWorkerModalOpen] = useState(false);
    const [newWorkerName, setNewWorkerName] = useState("");
    const [newWorkerError, setNewWorkerError] = useState<string | null>(null);
    const [newWorkerIsLoading, setNewWorkerIsLoading] = useState(false);

    const new_worker_mutation = useMutation(trpc.workers.new.mutationOptions({
        onSuccess: () => {
            setIsNewWorkerModalOpen(false);
            setNewWorkerName("");
            setNewWorkerError(null);
            setNewWorkerIsLoading(false);
            workers.refetch();
        },
    }))

    const handleNewWorkerSubmit = async () => {
        setNewWorkerIsLoading(true);
        try {
            const res = await new_worker_mutation.mutateAsync({ name: newWorkerName })

            setSelectedWorker(res);
        } catch (err) {
            if (err instanceof TRPCError) {
                setNewWorkerError(err.message);
            } else {
                setNewWorkerError("An unknown error occurred");
            }
        } finally {
            setNewWorkerIsLoading(false);
        }
    }

    return (
        <div>
            <NewWorkerDialog
                isOpen={isNewWorkerModalOpen}
                onClose={() => setIsNewWorkerModalOpen(false)}
                onSubmit={handleNewWorkerSubmit}
                isLoading={newWorkerIsLoading}
                error={newWorkerError}
                name={newWorkerName}
                setName={setNewWorkerName}
            />
            <DropdownMenu>
                <DropdownMenuTrigger className="hover:bg-foreground/10 px-2 py-0.5 rounded text-sm text-muted-foreground flex items-center gap-2 focus:outline-none">
                    {selected_worker_name || "Select Worker"} <ChevronDown className="w-4 h-4 mt-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {workers.data?.map((worker) => (
                        <DropdownMenuItem className="px-6 py-3" key={worker.id} onClick={() => setSelectedWorker(worker.id)}>
                            {worker.name}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="px-6 py-3" onClick={() => setIsNewWorkerModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        New Worker
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

type NewWorkerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
    name: string;
    setName: (name: string) => void;
    isLoading: boolean;
    error: string | null;
}

const NewWorkerDialog = ({ isOpen, onClose, onSubmit, isLoading, error, name, setName }: NewWorkerModalProps) => {

    const onOpenChange = useCallback((value: boolean) => {
        if (!value) {
            onClose();
        }
    }, [onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="mb-4">Create New Worker</DialogTitle>
                    <DialogDescription>
                        <Input className="mb-4" placeholder="Worker Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <Button onClick={() => onSubmit(name)} disabled={isLoading}>Create</Button>
                        {error && <p className="text-red-500">{error}</p>}
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
