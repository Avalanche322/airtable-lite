import { TextField, Box, CircularProgress, Tooltip, IconButton } from "@mui/material";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import useUpdateMutation from "../../hooks/useUpdateMutation";
import { useQueryClient } from "@tanstack/react-query";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const EditableCell = ({ info, field }: { info: any; field: string }) => {
	const updateMutation = useUpdateMutation();
	const queryClient = useQueryClient();
	const value = info.getValue() as any;
	const id = info.row.original.id as number;
	const conflict = info.row.original?.__conflict;
	const serverData = info.row.original?.__serverData;
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value ?? "");
	const [isSaving, setIsSaving] = useState(false);
	const timerRef = useRef<number | null>(null);

		// Only update the draft when not actively editing. This prevents incoming
		// realtime updates from clobbering the user's in-progress edit.
		useEffect(() => {
			if (!editing) setDraft(value ?? "");
		}, [value, editing]);

	const doCommit = async (finalDraft: any) => {
	if (finalDraft === value) {
		setIsSaving(false);
		return;
	}
	setIsSaving(true);
	try {
		// convert number fields appropriately
		const patch: Record<string, any> = {};
		patch[field] = finalDraft;
		await updateMutation.mutateAsync({ id, patch });
	} catch (err) {
		// error handling: rollback is handled by onError
		console.error('Update failed', err);
	} finally {
		setIsSaving(false);
	}
	};

	const commit = () => {
	if (timerRef.current) {
		window.clearTimeout(timerRef.current);
		timerRef.current = null;
	}
	setEditing(false);
	doCommit(draft);
	};

	const scheduleCommit = (val: any) => {
	if (timerRef.current) window.clearTimeout(timerRef.current);
	timerRef.current = window.setTimeout(() => doCommit(val), 350);
	};

	// Different input types for fields
	const numberFields = new Set(['score', 'size', 'rating']);
	const selectOptionsMap: Record<string, string[]> = {
		status: ['draft', 'in_review', 'published', 'archived'],
		priority: ['low', 'medium', 'high'],
		type: ['creative', 'copy', 'video'],
		category: ['ad', 'social', 'banner', 'email', 'landing'],
	};

	const isNumber = typeof value === 'number' || numberFields.has(field);
	const selectOptions = selectOptionsMap[field] as string[] | undefined;

	if (isNumber) {
	return editing ? (
		<TextField
			value={String(draft)}
			size="small"
			type="number"
			onChange={(e: ChangeEvent<HTMLInputElement>) => {
			const v = e.target.value;
			setDraft(v);
			scheduleCommit(Number(v));
			}}
			onBlur={commit}
			onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
			if ((e as KeyboardEvent<HTMLInputElement>).key === "Enter") commit();
			if ((e as KeyboardEvent<HTMLInputElement>).key === "Escape") {
				setDraft(value ?? "");
				setEditing(false);
			}
			}}
			autoFocus
		/>
	) : (
		<Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
			<Box onDoubleClick={() => setEditing(true)} sx={{ flex: 1 }}>{String(value ?? "")}</Box>
			{conflict && (
				<Tooltip title="Conflict detected — server has different value. Click to load server value">
					<IconButton size="small" onClick={() => {
						if (!serverData) return;
						// replace item in cache with serverData and clear conflict
						const key = ["items"] as const;
						const current = queryClient.getQueryData(key) as any;
						if (!current) return;
						const pages = (current.pages || []).map((page: any) => ({
							...page,
							items: (page.items || []).map((it: any) => it.id === id ? { ...serverData, __conflict: false, __pending: undefined, __serverData: undefined } : it)
						}));
						queryClient.setQueryData(key, { ...current, pages });
					}}>
						<WarningAmberIcon fontSize="small" color="warning" />
					</IconButton>
				</Tooltip>
			)}
			{isSaving && <CircularProgress size={12} />}
		</Box>
	);
	}

	if (selectOptions) {
	return editing ? (
		<TextField
			select
			value={draft}
			size="small"
			onChange={(e) => {
			const v = e.target.value;
			setDraft(v);
			// commit immediately for selects
			doCommit(v);
			setEditing(false);
			}}
			onBlur={() => setEditing(false)}
			SelectProps={{ native: false }}
			autoFocus
		>
			{selectOptions.map((s) => (
			<option key={s} value={s}>{s}</option>
			))}
		</TextField>
	) : (
		<Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
			<Box onDoubleClick={() => setEditing(true)} sx={{ flex: 1 }}>{String(value ?? "")}</Box>
			{conflict && (
				<Tooltip title="Conflict detected — server has different value. Click to load server value">
					<IconButton size="small" onClick={() => {
						if (!serverData) return;
						const key = ["items"] as const;
						const current = queryClient.getQueryData(key) as any;
						if (!current) return;
						const pages = (current.pages || []).map((page: any) => ({
							...page,
							items: (page.items || []).map((it: any) => it.id === id ? { ...serverData, __conflict: false, __pending: undefined, __serverData: undefined } : it)
						}));
						queryClient.setQueryData(key, { ...current, pages });
					}}>
						<WarningAmberIcon fontSize="small" color="warning" />
					</IconButton>
				</Tooltip>
			)}
			{isSaving && <CircularProgress size={12} />}
		</Box>
	);
	}

	// default text field editor
	return editing ? (
	<TextField
		value={draft}
		size="small"
		onChange={(e: ChangeEvent<HTMLInputElement>) => {
			setDraft(e.target.value);
			scheduleCommit(e.target.value);
		}}
		onBlur={commit}
		onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
			if ((e as KeyboardEvent<HTMLInputElement>).key === "Enter") commit();
			if ((e as KeyboardEvent<HTMLInputElement>).key === "Escape") {
			setDraft(value ?? "");
			setEditing(false);
			}
		}}
		autoFocus
	/>
	) : (
	<Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
		<Box onDoubleClick={() => setEditing(true)} sx={{ flex: 1 }}>{String(value ?? "")}</Box>
		{conflict && (
			<Tooltip title="Conflict detected — server has different value. Click to load server value">
				<IconButton size="small" onClick={() => {
					if (!serverData) return;
					const key = ["items"] as const;
					const current = queryClient.getQueryData(key) as any;
					if (!current) return;
					const pages = (current.pages || []).map((page: any) => ({
						...page,
						items: (page.items || []).map((it: any) => it.id === id ? { ...serverData, __conflict: false, __pending: undefined, __serverData: undefined } : it)
					}));
					queryClient.setQueryData(key, { ...current, pages });
				}}>
					<WarningAmberIcon fontSize="small" color="warning" />
				</IconButton>
			</Tooltip>
		)}
		{isSaving && <CircularProgress size={12} />}
	</Box>
	);
};

export default EditableCell;