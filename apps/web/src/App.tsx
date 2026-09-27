import { Navigate, Route, Routes } from "react-router-dom";
import { DemoProvider } from "./demo-context";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { MirrorPage } from "./pages/MirrorPage";
import { ConnectPage } from "./pages/ConnectPage";
import { LedgerPage } from "./pages/LedgerPage";
import { AuditPage } from "./pages/AuditPage";
import { InboxPage } from "./pages/InboxPage";
import { ConsultProvider } from "./consult-context";
import { useAccountAuth } from "./auth-context";
import { personas } from "@relay/demo-seed";
import { AuthPage } from "./pages/AuthPage";

function ProductRoutes({ actorId }: { actorId: string }) {
  return (
    <DemoProvider actorId={actorId}>
      <ConsultProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="mirror" element={<MirrorPage />} />
            <Route path="connect" element={<ConnectPage />} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ConsultProvider>
    </DemoProvider>
  );
}

export function App() {
  const auth = useAccountAuth();

  if (!auth.isAuthenticated) return <AuthPage />;
  if (!auth.hcpId || !personas.some((item) => item.id === auth.hcpId)) return <AuthPage />;

  return <ProductRoutes actorId={auth.hcpId} />;
}
