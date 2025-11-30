import { TextField, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { ChangeEvent, useEffect, useRef, useState, KeyboardEvent } from "react";
import useUpdateMutation from "../../hooks/useUpdateMutation";
import { useQueryClient } from "@tanstack/react-query";
import ConflictTooltip from "./ConflictTooltip";
import { Item, ItemsPage } from "../../types";
import { CellContext } from "@tanstack/react-table";

const EditableCell = ({
  info,
  field,
}: {
  info: CellContext<Item, string | number>;
  field: string;
}) => {
  const updateMutation = useUpdateMutation();
  const queryClient = useQueryClient();
  const value = info.getValue();
  const id = info.row.original.id as number;
  const conflict = info.row.original?.__conflict;
  const serverData = info.row.original?.__serverData;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | number>(value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Only update the draft when not actively editing. This prevents incoming
  // realtime updates from clobbering the user's in-progress edit.
  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  const doCommit = async (finalDraft: string | number) => {
    if (finalDraft === value) {
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    try {
      // convert number fields appropriately
      const patch: Record<string, number | string> = {};
      patch[field] = finalDraft;
      await updateMutation.mutateAsync({ id, patch });
    } catch (err) {
      // error handling: rollback is handled by onError
      console.error("Update failed", err);
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

  const scheduleCommit = (val: string | number) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => doCommit(val), 350);
  };

  const handleResolveConflict = () => {
    if (!serverData) return;
    // replace item in cache with serverData and clear conflict
    const key = ["items"] as const;
    const current = queryClient.getQueryData(key) as { pages: ItemsPage[] };
    if (!current) return;
    const pages = (current.pages || []).map((page) => ({
      ...page,
      items: (page.items || []).map((it) =>
        it.id === id
          ? {
              ...serverData,
              __conflict: false,
              __pending: undefined,
              __serverData: undefined,
            }
          : it
      ),
    }));
    queryClient.setQueryData(key, { ...current, pages });
  };

  const handleChangeNumber = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDraft(v);
    scheduleCommit(Number(v));
  };

  const handleChangeString = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDraft(v);
    scheduleCommit(v);
  };
  ``;
  const handleChangeSelect = (e: SelectChangeEvent<any>) => {
    const v = e.target.value;
    setDraft(v);
    doCommit(v);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e as KeyboardEvent<HTMLInputElement>).key === "Enter") commit();
    if ((e as KeyboardEvent<HTMLInputElement>).key === "Escape") {
      setDraft(value ?? "");
      setEditing(false);
    }
  };

  // Different input types for fields
  const numberFields = new Set(["score", "size", "rating"]);
  const selectOptionsMap: Record<string, string[]> = {
    status: ["draft", "in_review", "published", "archived"],
    priority: ["low", "medium", "high"],
    type: ["creative", "copy", "video"],
    category: ["ad", "social", "banner", "email", "landing"],
  };

  const isNumber = typeof value === "number" || numberFields.has(field);
  const selectOptions = selectOptionsMap[field] as string[] | undefined;

  if (isNumber) {
    return editing ? (
      <TextField
        value={String(draft)}
        size="small"
        type="number"
        onChange={handleChangeNumber}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    ) : (
      <ConflictTooltip
        conflict={conflict}
        value={value}
        setEditing={setEditing}
        handleResolveConflict={handleResolveConflict}
        isSaving={isSaving}
      />
    );
  }

  if (selectOptions) {
    return editing ? (
      <Select
        value={draft}
        size="small"
        onChange={handleChangeSelect}
        onBlur={() => setEditing(false)}
        autoFocus
      >
        {selectOptions.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </Select>
    ) : (
      <ConflictTooltip
        conflict={conflict}
        value={value}
        setEditing={setEditing}
        handleResolveConflict={handleResolveConflict}
        isSaving={isSaving}
      />
    );
  }

  return editing ? (
    <TextField
      value={draft}
      size="small"
      onChange={handleChangeString}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  ) : (
    <ConflictTooltip
      conflict={conflict}
      value={value}
      setEditing={setEditing}
      handleResolveConflict={handleResolveConflict}
      isSaving={isSaving}
    />
  );
};

export default EditableCell;
