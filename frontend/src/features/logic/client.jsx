import React, { useEffect, useMemo, useState } from "react";
import ClientCard from "../../components/logic/ClientCard";
import "../style/client.css";
import getAllClient from "../../services/client.service";
import { Link, Navigate } from "react-router-dom";

function Client() {
  const [clientStore, setClientStore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const organisationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const token = localStorage.getItem("token");

  /* =========================================
     AUTHENTICATION
  ========================================= */

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  /* =========================================
     FETCH CLIENTS
  ========================================= */

  useEffect(() => {
    fetchClient(organisationId);
  }, [organisationId]);

  const fetchClient = async (organisationId) => {
    if (!organisationId) {
      setError("No organisation selected.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAllClient.getAllClient(organisationId);

      const normalized = Array.isArray(data)
        ? data.map((client) => ({
            ...client,

            company:
              client.companyName ||
              client.company ||
              "",

            email:
              client.email ||
              client.mail ||
              "",
          }))
        : [];

      setClientStore(normalized);

    } catch (err) {
      console.error("Failed to fetch clients:", err);

      setError(
        "Failed to load clients. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     FILTER CLIENTS
  ========================================= */

  const filteredClients = useMemo(() => {
    return clientStore.filter((client) => {

      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        client.name
          ?.toLowerCase()
          .includes(searchValue) ||

        client.email
          ?.toLowerCase()
          .includes(searchValue) ||

        client.company
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        status === "All"
          ? true
          : client.status === status;

      return matchesSearch && matchesStatus;
    });

  }, [clientStore, search, status]);


  /* =========================================
     STATS
  ========================================= */

  const totalClients = clientStore.length;

  const activeClients = clientStore.filter(
    (client) => client.status === "Active"
  ).length;

  const pendingClients = clientStore.filter(
    (client) => client.status === "Pending"
  ).length;

  const overdueClients = clientStore.filter(
    (client) => client.status === "Overdue"
  ).length;


  /* =========================================
     UI
  ========================================= */

  return (
    <div className="client-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="client-header-row">

        <div className="client-header">

          <div>
            <h1>Clients</h1>

            <p>
              Manage and track all your clients in one place.
            </p>
          </div>

        </div>

        <Link
          to="/add-client"
          className="client-add-btn"
        >
          <span>+</span>
          Add Client
        </Link>

      </div>


      {/* =====================================
          STAT CARDS
      ===================================== */}

      <div className="client-stats">

        <div className="client-stat-card">

          <div className="client-stat-icon purple">
            👥
          </div>

          <div>
            <p>Total Clients</p>
            <h3>{totalClients}</h3>
          </div>

        </div>


        <div className="client-stat-card">

          <div className="client-stat-icon green">
            ✓
          </div>

          <div>
            <p>Active</p>
            <h3>{activeClients}</h3>
          </div>

        </div>


        <div className="client-stat-card">

          <div className="client-stat-icon yellow">
            ◷
          </div>

          <div>
            <p>Pending</p>
            <h3>{pendingClients}</h3>
          </div>

        </div>


        <div className="client-stat-card">

          <div className="client-stat-icon red">
            !
          </div>

          <div>
            <p>Overdue</p>
            <h3>{overdueClients}</h3>
          </div>

        </div>

      </div>


      {/* =====================================
          SEARCH + FILTER
      ===================================== */}

      <div className="client-toolbar">

        <div className="client-search">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by name, email or company..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}

        </div>


        <select
          className="client-status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          <option value="All">
            All status
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Overdue">
            Overdue
          </option>

        </select>

      </div>


      {/* =====================================
          CLIENT TABLE
      ===================================== */}

      <div className="client-table-container">

        {/* TABLE HEADER */}

        <div className="client-table-header">

          <span>CLIENT</span>

          <span>COMPANY</span>

          <span>EMAIL</span>

          <span>STATUS</span>

          <span>ACTION</span>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="client-state">

            <div className="loading-spinner"></div>

            <h3>
              Loading clients...
            </h3>

            <p>
              Please wait while we fetch your clients.
            </p>

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="client-state error-state">

            <div className="state-icon">
              !
            </div>

            <h3>
              Something went wrong
            </h3>

            <p>
              {error}
            </p>

            <button
              className="retry-btn"
              onClick={() =>
                fetchClient(organisationId)
              }
            >
              Try Again
            </button>

          </div>

        )}


        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredClients.length === 0 && (

            <div className="client-state">

              <div className="empty-icon">
                👥
              </div>

              <h3>
                No Clients Found
              </h3>

              <p>
                {search
                  ? "Try changing your search."
                  : "Start by adding your first client."}
              </p>

              {!search && (
                <Link
                  to="/add-client"
                  className="empty-add-btn"
                >
                  + Add Client
                </Link>
              )}

            </div>

          )}


        {/* CLIENTS */}

        {!loading &&
          !error &&
          filteredClients.length > 0 && (

            <div className="client-list">

              {filteredClients.map((client) => (

                <Link
                  key={client.id}
                  to={`/client/${client.id}`}
                  className="client-row"
                >

                  <ClientCard
                    name={client.name}
                    mail={client.email}
                    company={client.company}
                    status={client.status}
                  />

                </Link>

              ))}

            </div>

          )}

      </div>

    </div>
  );
}

export default Client;