import { Box, CircularProgress, Tooltip, IconButton } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const ConflictTooltip = ({
  conflict,
  value,
  setEditing,
  isSaving,
  handleResolveConflict,
}: {
  conflict: boolean | undefined;
  value: string | unknown;
  setEditing: (editing: boolean) => void;
  isSaving: boolean;
  handleResolveConflict: () => void;
}) => {
  return (
    <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1 }}>
      <Box onDoubleClick={() => setEditing(true)} sx={{ flex: 1 }}>
        {String(value ?? "")}
      </Box>
      {conflict && (
        <Tooltip title="Conflict detected — server has different value. Click to load server value">
          <IconButton size="small" onClick={handleResolveConflict}>
            <WarningAmberIcon fontSize="small" color="warning" />
          </IconButton>
        </Tooltip>
      )}
      {isSaving && <CircularProgress size={12} />}
    </Box>
  );
};
export default ConflictTooltip;
