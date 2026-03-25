import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser } from "../services/api";

function Sidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const links = [{ label: "Dashboard", path: "/dashboard" }];

  if (user?.role === "ADMIN") {
    links.push(
      { label: "Patients", path: "/patients" },
      { label: "Doctors", path: "/doctors" },
      { label: "Billing", path: "/billing" }
    );
  }

  links.push({ label: "Appointments", path: "/appointments" });

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Hospital MS</h1>
        <p>
          {user?.name || user?.username
            ? `Signed in as ${user.name || user.username}${user.role ? ` (${user.role})` : ""}`
            : "Manage patients, doctors, appointments, and billing insights."}
        </p>
      </div>

      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `nav-link${isActive ? " active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
