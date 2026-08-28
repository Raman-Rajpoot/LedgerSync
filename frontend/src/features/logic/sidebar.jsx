import "../style/sidebar.css";

import {
  FiHome,
  FiUsers,
  FiFolder,
  FiFileText,
  FiCreditCard,
  FiBell,
  FiBarChart2,
  FiSettings,
  FiChevronDown,
  FiBriefcase,
  FiUser,
  FiLogOut,
  FiAlertTriangle,
  FiLink,
  FiActivity,
  FiLayers,
} from "react-icons/fi";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";


/* ==========================================
   SIDEBAR MENU
========================================== */

const menuItems = [

  {
    icon: <FiHome />,
    label: "Dashboard",
    path: "/dashboard",
  },

  {
    icon: <FiUsers />,
    label: "Clients",
    path: "/clients",
  },

  // {
  //   icon: <FiFolder />,
  //   label: "Projects",
  //   path: "/projects",
  // },

  {
    icon: <FiFileText />,
    label: "Invoices",
    path: "/invoices",
  },

  {
    icon: <FiCreditCard />,
    label: "Payments",
    path: "/payments",
  },

  {
    icon: <FiBell />,
    label: "Reminders",
    path: "/reminders",
  },

  {
    icon: <FiLayers />,
    label: "Templates",
    path: "/templates",
  },

  {
    icon: <FiAlertTriangle />,
    label: "Escalations",
    path: "/escalations",
  },

  {
    icon: <FiBarChart2 />,
    label: "Reports",
    path: "/reports",
  },

  {
    icon: <FiLink />,
    label: "Integrations",
    path: "/integrations",
  },

  {
    icon: <FiActivity />,
    label: "Activity Logs",
    path: "/activity",
  },

  {
    icon: <FiSettings />,
    label: "Settings",
    path: "/settings",
  },

];


/* ==========================================
   SIDEBAR
========================================== */

export default function Sidebar() {

  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] =
    useState(false);


  /* ========================================
     LOGOUT
  ======================================== */

  const handleLogout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem(
      "organizationId"
    );

    localStorage.removeItem(
      "organisationId"
    );

    navigate("/login", {
      replace: true,
    });

  };


  /* ========================================
     PROFILE
  ======================================== */

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const userName =
    user.name ||
    user.fullName ||
    "Raman Singh";

  const userEmail =
    user.email ||
    "ram@gmail.com";

  const avatar =
    userName.charAt(0).toUpperCase();


  return (

    <aside className="sidebar">


      {/* =====================================
          LOGO
      ===================================== */}

      <div
        className="sidebar-logo"
        onClick={() =>
          navigate("/dashboard")
        }
      >

        <div className="logo-box">

          <FiBriefcase />

        </div>


        <div className="logo-content">

          <h2>
            LedgerSync
          </h2>

          <p>
            Track. Remind. Collect.
          </p>

        </div>

      </div>



      {/* =====================================
          MENU
      ===================================== */}

      <nav className="sidebar-menu">

        {menuItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}

            className={({ isActive }) =>
              `menu-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >

            <span className="menu-icon">

              {item.icon}

            </span>


            <span className="menu-label">

              {item.label}

            </span>

          </NavLink>

        ))}

      </nav>



      {/* =====================================
          PROFILE
      ===================================== */}

      <div className="sidebar-profile-container">


        {/* PROFILE DROPDOWN */}

        {profileOpen && (

          <div className="profile-dropdown">


            <button
              onClick={() => {

                navigate("/profile");

                setProfileOpen(false);

              }}
            >

              <FiUser />

              <span>
                Profile
              </span>

            </button>


            <button
              onClick={() => {

                navigate("/settings");

                setProfileOpen(false);

              }}
            >

              <FiSettings />

              <span>
                Settings
              </span>

            </button>


            <div className="dropdown-divider" />


            <button
              className="logout-button"
              onClick={handleLogout}
            >

              <FiLogOut />

              <span>
                Logout
              </span>

            </button>

          </div>

        )}



        {/* PROFILE BUTTON */}

        <button
          className="sidebar-profile"

          onClick={() =>
            setProfileOpen(
              !profileOpen
            )
          }
        >

          <div className="profile-left">


            <div className="profile-avatar">

              {avatar}

            </div>


            <div className="profile-info">

              <h4>
                {userName}
              </h4>

              <p>
                {userEmail}
              </p>

            </div>

          </div>


          <FiChevronDown
            className={`profile-arrow ${
              profileOpen
                ? "rotate"
                : ""
            }`}
          />

        </button>

      </div>

    </aside>

  );
}