import { Routes, Route, Navigate } from "react-router-dom";

/* ================================
   AUTH
================================ */

import Login from "./features/logic/Login";
import Register from "./features/logic/Register";

/* ================================
   CLIENTS
================================ */

import Client from "./features/logic/client";
import AddClient from "./features/logic/addClient";
import SingleClientCard from "./features/logic/perticularClient";

/* ================================
   LEDGERSYNC PAGES
================================ */

import Dashboard from "./features/logic/dashboard";
import Project from "./features/logic/project";
import Invoices from "./features/logic/invoice";
import Payments from "./features/logic/payment";
import Reminders from "./features/logic/reminders";
import Templates from "./features/logic/templates";
import Escalations from "./features/logic/escalation";
import Reports from "./features/logic/reports";
import Settings from "./features/logic/settings";
import Integrations from "./features/logic/integrations.jsx";
import Activity from "./features/logic/activity";
import Profile from "./features/logic/profile";
import AddInvoice from "./features/logic/addInvoice.jsx";


/* ==========================================
   NAVIGATION
========================================== */

function Navigation() {

  return (

    <Routes>

      {/* =================================
          AUTH
      ================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* =================================
          DASHBOARD
      ================================= */}

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />


      {/* =================================
          CLIENTS
      ================================= */}

      <Route
        path="/clients"
        element={<Client />}
      />

      <Route
        path="/add-client"
        element={<AddClient />}
      />

      <Route
        path="/client/:id"
        element={<SingleClientCard />}
      />


      {/* =================================
          PROJECTS
      ================================= */}
{/* 
      <Route
        path="/projects"
        element={<Project />}
      /> */}


      {/* =================================
          INVOICES
      ================================= */}

      <Route
        path="/invoices"
        element={<Invoices />}
      />

     <Route
        path="/add-invoice"
        element={
          <AddInvoice  />
        }
      />

      {/* =================================
          PAYMENTS
      ================================= */}

      <Route
        path="/payments"
        element={<Payments />}
      />


      {/* =================================
          REMINDERS
      ================================= */}

      <Route
        path="/reminders"
        element={<Reminders />}
      />


      {/* =================================
          TEMPLATES
      ================================= */}

      <Route
        path="/templates"
        element={<Templates />}
      />


      {/* =================================
          ESCALATIONS
      ================================= */}

      <Route
        path="/escalations"
        element={<Escalations />}
      />


      {/* =================================
          REPORTS
      ================================= */}

      <Route
        path="/reports"
        element={<Reports />}
      />


      {/* =================================
          SETTINGS
      ================================= */}

      <Route
        path="/settings"
        element={<Settings />}
      />


      {/* =================================
          INTEGRATIONS
      ================================= */}

      <Route
        path="/integrations"
        element={<Integrations />}
      />


      {/* =================================
          ACTIVITY / COMMUNICATION LOGS
      ================================= */}

      <Route
        path="/activity"
        element={<Activity />}
      />

      {/* Optional alias */}

      <Route
        path="/activity-logs"
        element={
          <Navigate
            to="/activity"
            replace
          />
        }
      />


      {/* =================================
          PROFILE
      ================================= */}

      <Route
        path="/profile"
        element={<Profile />}
      />


      {/* =================================
          UNKNOWN URL
      ================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>

  );

}

export default Navigation;