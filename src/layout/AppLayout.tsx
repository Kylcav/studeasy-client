import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./topbar";

export default function AppLayout() {
  return (
    <div className="bg-grid bg-overlay">
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <Topbar />
          <main className="app-content">
            <div className="container">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
