import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <main style={{ flex: 1 }}>
        <Topbar />
        {children}
      </main>
    </div>
  );
}
