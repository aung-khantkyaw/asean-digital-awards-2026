import { Outlet } from "react-router-dom";
import Header from "@/components/common/Header";
import AdminSidebar from "./Sidebar";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
