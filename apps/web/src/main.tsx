import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import { StrictMode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import theme from "./theme";
import RealtimeProvider from "./shared/realtime/RealtimeProvider";

const queryClient = new QueryClient();

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <ThemeProvider theme={theme} defaultMode="dark">
      <QueryClientProvider client={queryClient}>
        <CssBaseline enableColorScheme />
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
