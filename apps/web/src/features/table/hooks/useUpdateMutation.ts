import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateItem } from "../services/itemsAPI";

const useUpdateMutation = () => {
	const queryClient = useQueryClient();
	
	const updateMutation = useMutation<any, any, any, any>({
	  mutationFn: (variables: { id: number; patch: Record<string, any> }) =>
		 updateItem(variables.id, variables.patch),
	  onMutate: async (variables: { id: number; patch: Record<string, any> }) => {
		 const { id, patch } = variables;
		 await queryClient.cancelQueries(["items"] as any);
		 const previous = queryClient.getQueryData(["items"] as any);
		 // apply optimistic patch and store pending metadata for conflict detection
		 queryClient.setQueryData(["items"] as any, (old: any) => {
			if (!old) return old;
			const newPages = (old.pages || []).map((page: any) => ({
			  ...page,
			  items: (page.items || []).map((it: any) =>
				 it.id === id
					 ? { ...it, ...patch, __pending: { baseVersion: (it.version ?? 0), patch }, __conflict: false }
					 : it
			  ),
			}));
			return { ...old, pages: newPages };
		 });
		 return { previous, id, patch };
	  },
	  onError: (_err: any, _vars: any, context: any) => {
		 if (context?.previous)
			queryClient.setQueryData(["items"] as any, context.previous);
	  },
	  onSuccess: (data: any) => {
		 try {
			 const id = data.id;
			 const returnedItem = data as any;
			 const key = ["items"] as const;
			 const current = queryClient.getQueryData(key) as any;
			 if (!current) return;
			 const pages = (current.pages || []).map((page: any) => {
				 return {
					 ...page,
					 items: (page.items || []).map((it: any) => {
						 if (it.id !== id) return it;
						 const pending = (it as any).__pending;
						 if (pending) {
							 const pendingPatch = pending.patch || {};
							 const applied = Object.keys(pendingPatch).every((k) => {
								 return (returnedItem as any)[k] === pendingPatch[k] || (returnedItem.data && returnedItem.data[k] === pendingPatch[k]);
							 });
							 if (applied) {
								 // server applied our patch — replace with authoritative item and clear pending/conflict
								 return { ...returnedItem, __conflict: false };
							 } else {
								 // conflict: server has a different change — store server snapshot and mark conflict
								 return { ...it, __conflict: true, __serverData: { ...returnedItem } };
							 }
						 }
						 const existingVersion = it.version ?? 0;
						 const incomingVersion = returnedItem.version ?? 0;
						 if (incomingVersion >= existingVersion) return { ...returnedItem, __conflict: false };
						 return it;
					 }),
				 };
			 });
			 queryClient.setQueryData(key, { ...current, pages });
		 } catch (e) {
			 console.error('onSuccess merge error', e);
		 }
	  },
	  onSettled: () => {
		 queryClient.invalidateQueries(["items"] as any);
	  },
	});

	return updateMutation;
}

export default useUpdateMutation;