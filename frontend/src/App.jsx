import { Navigate, Route, Routes } from "react-router-dom";
import PageWrapper from "./components/layout/PageWrapper";
import Sidebar from "./components/layout/Sidebar";
import Budget from "./pages/Budget";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import Investments from "./pages/Investments";

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <Sidebar />
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageWrapper>
    </div>
  );
}
