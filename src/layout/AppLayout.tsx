import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./topbar";

export default function AppLayout() {
  return (
    <div className="bg-grid bg-overlay" style={{ minHeight: "100vh" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <Topbar />
          <main style={{ padding: 24 }}>
            <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
