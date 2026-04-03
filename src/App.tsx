import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { HistoryPage } from "./pages/HistoryPage";
import { MeasurementPage } from "./pages/MeasurementPage";
import { GoogleOAuthCallback } from "./pages/GoogleOAuthCallback";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/measurement" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/oauth-callback" element={<GoogleOAuthCallback />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/measurement" element={<MeasurementPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
