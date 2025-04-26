import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/client/components/ui/dropdown-menu";
import { Button } from "@/client/components/ui/button";
import { useTRPC } from "@/client/trpc_client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/client/components/ui/dialog";
import { Input } from "@/client/components/ui/input";
import { TRPCError } from "@trpc/server";
import { ChevronDown, Code, Plus } from "lucide-react";
import Cookies from "js-cookie";

export const WORKER_ID_COOKIE_NAME = "yukako_worker_id";

type WorkerProviderState = {
    workers: ({ id: string, name: string })[]
    selected_worker_id: string | null
    selected_worker_name: string | null
    setSelectedWorker: (worker_id: string) => void
}

const WorkerProviderContext = createContext<WorkerProviderState>({
    workers: [],
    selected_worker_id: null,
    selected_worker_name: null,
    setSelectedWorker: () => null,
});

type WorkerProviderProps = {
    children: React.ReactNode
}

export const WorkerProvider = ({ children }: WorkerProviderProps) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const workers = useQuery(trpc.workers.list.queryOptions())

    const sorted_workers = useMemo(() => {
        const sorted_workers = [...(workers.data ?? [])];
        sorted_workers.sort((a, b) => a.name.localeCompare(b.name));
        return sorted_workers;
    }, [workers.data]);

    const [selectedWorker, setSelectedWorker] = useState<string | null>(() => {
        const worker_id = Cookies.get(WORKER_ID_COOKIE_NAME);
        return worker_id ?? null;
    });

    const { selected_worker_id, selected_worker_name } = useMemo(() => {
        const selected_worker_id = selectedWorker ? workers.data?.find((worker) => worker.id === selectedWorker)?.id ?? null : null;
        const selected_worker_name = selectedWorker ? workers.data?.find((worker) => worker.id === selectedWorker)?.name ?? null : null;
        return { selected_worker_id, selected_worker_name }
    }, [selectedWorker, workers.data]);

    useEffect(() => {
        if (!selected_worker_id && sorted_workers.length > 0) {
            setSelectedWorker(sorted_workers[0].id);
        }
    }, [selected_worker_id, sorted_workers])

    useEffect(() => {
        if (selected_worker_id) {
            Cookies.set(WORKER_ID_COOKIE_NAME, selected_worker_id);
        } else {
            Cookies.remove(WORKER_ID_COOKIE_NAME);
        }

        queryClient.invalidateQueries();
    }, [selected_worker_id])

    return (
        <WorkerProviderContext.Provider value={{ workers: sorted_workers, selected_worker_id, selected_worker_name, setSelectedWorker }}>
            {children}
        </WorkerProviderContext.Provider>
    )
}

export const useWorkerSelection = () => {
    const { workers, selected_worker_id, selected_worker_name, setSelectedWorker } = useContext(WorkerProviderContext);
    return { workers, selected_worker_id, selected_worker_name, setSelectedWorker };
}

export const WorkerSwitcher = () => {

    const { workers, selected_worker_id, selected_worker_name, setSelectedWorker } = useWorkerSelection();
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [isNewWorkerModalOpen, setIsNewWorkerModalOpen] = useState(false);
    const [newWorkerName, setNewWorkerName] = useState("");
    const [newWorkerError, setNewWorkerError] = useState<string | null>(null);
    const [newWorkerIsLoading, setNewWorkerIsLoading] = useState(false);

    const new_worker_mutation = useMutation(trpc.workers.new.mutationOptions({
        onSuccess: (worker_id) => {
            setIsNewWorkerModalOpen(false);
            setNewWorkerName("");
            setNewWorkerError(null);
            setNewWorkerIsLoading(false);
            queryClient.invalidateQueries();
            setSelectedWorker(worker_id);
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
                <DropdownMenuTrigger className="hover:bg-foreground/5 px-2 py-0.5 rounded text-sm text-muted-foreground flex items-center gap-2 focus:outline-none">
                    {selected_worker_name || "Select Worker"} <ChevronDown className="w-4 h-4 mt-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-0 rounded-sm min-w-48">
                    {workers.map((worker) => (
                        <DropdownMenuItem
                            className={`flex items-center gap-2 px-6 py-3 rounded-none hover:bg-foreground/15 hover:text-foreground ${selected_worker_id === worker.id ? 'text-foreground bg-foreground/5' : 'text-muted-foreground'}`}
                            key={worker.id}
                            onClick={() => setSelectedWorker(worker.id)}
                        >
                            <Code className="w-4 h-4" />
                            {worker.name}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="my-0.5" />
                    <DropdownMenuItem className="px-6 py-3 rounded-none" onClick={() => setIsNewWorkerModalOpen(true)}>
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

export const NewWorkerButton = () => {

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const new_worker_mutation = useMutation(trpc.workers.new.mutationOptions({
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    }))

    const { setSelectedWorker } = useWorkerSelection();

    const [isNewWorkerModalOpen, setIsNewWorkerModalOpen] = useState(false);
    const [newWorkerName, setNewWorkerName] = useState("");
    const [newWorkerError, setNewWorkerError] = useState<string | null>(null);
    const [newWorkerIsLoading, setNewWorkerIsLoading] = useState(false);

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

    return <>
        <Button onClick={() => setIsNewWorkerModalOpen(true)}>New Worker</Button>
        <NewWorkerDialog
            isOpen={isNewWorkerModalOpen}
            onClose={() => setIsNewWorkerModalOpen(false)}
            onSubmit={handleNewWorkerSubmit}
            isLoading={newWorkerIsLoading}
            error={newWorkerError}
            name={newWorkerName}
            setName={setNewWorkerName}
        />
    </>
}
