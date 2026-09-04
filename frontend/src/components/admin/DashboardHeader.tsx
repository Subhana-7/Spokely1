import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/adminService";

const DashboardHeader = () => {
  const navItems = [
    { label: "Dashboard", path: "/admin/home" },
    { label: "User Management", path: "/admin/users" },
    { label: "Mentor Management", path: "/admin/mentors" },
    { label: "Session Management", path: "/admin/sessions" },
    { label: "Payment Management", path: "/admin/payment-management" },
    { label: "Tasks", path: "/admin/tasks" },
    { label: "Reports", path: "/admin/reports" },
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      logout();
      navigate("/");
    } catch (error) {
      console.log("logout unsuccessful",error);
    }
  };

  return (
    <header className="bg-gray-700 shadow-sm border-b text-white">
      <div className="px-4 md:px-6 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="w-full flex flex-col lg:flex-row lg:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Spokely Admin
          </h1>
          <nav className="flex flex-wrap gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }: { isActive: boolean }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-white hover:text-gray-800 hover:bg-gray-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <button
          type="button"
          className="self-end lg:self-auto px-4 py-2 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 hover:border-red-400 transition"
          onClick={() => {
            handleLogout();
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
