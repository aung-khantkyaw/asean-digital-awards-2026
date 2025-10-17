import { Outlet } from "react-router-dom";

const CollaboratorLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CollaboratorLayout;
