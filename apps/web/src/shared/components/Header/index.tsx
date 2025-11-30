import AppBar from "@mui/material/AppBar";
import TableViewIcon from "@mui/icons-material/TableView";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { IconButton, Tooltip, useColorScheme } from "@mui/material";
import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";

export default function Header() {
	const { mode, setMode } = useColorScheme();
	
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <TableViewIcon sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Airtable Lite
          </Typography>
          <Tooltip title={`Activate ${mode === "dark" ? "light" : "dark"} Mode`}>
            <IconButton
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              size="large"
              color="inherit"
            >
              {mode === "dark" ? (
                <LightModeOutlined />
              ) : (
                <DarkModeOutlined color="action" />
              )}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
