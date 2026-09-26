import { Navigate, Route, Routes } from "react-router-dom";
import { DemoProvider } from "./demo-context";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { MirrorPage } from "./pages/MirrorPage";
import { ConnectPage } from "./pages/ConnectPage";
import { LedgerPage } from "./pages/LedgerPage";
import { AuditPage } from "./pages/AuditPage";

export function App() {
  return (
    <DemoProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="mirror" element={<MirrorPage />} />
          <Route path="connect" element={<ConnectPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DemoProvider>
  );
}
