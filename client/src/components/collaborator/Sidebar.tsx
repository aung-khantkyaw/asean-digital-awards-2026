import { NavLink } from "react-router-dom";

const base = "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium";

const Sidebar = () => {
  const links = [
    { to: "/collaborator/overview", label: "Overview" },
    { to: "/collaborator/submissions", label: "Submissions" },
    { to: "/collaborator/profile", label: "Profile" },
  ];

  return (
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-900/40 p-4 lg:block">
      <div className="mb-6 text-lg font-semibold">Collaborator</div>
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `${base} ${
                isActive
                  ? "bg-slate-800 text-slate-100"
                  : "hover:bg-slate-800/60"
              }`
            }
          >
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
