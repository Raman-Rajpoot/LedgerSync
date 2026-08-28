import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import "../style/activity.css";

function Activity() {
  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [channel, setChannel] = useState("ALL");

  const [status, setStatus] = useState("ALL");

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchLogs();
  }, [page, channel, status]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        organizationId,
        page,
        limit: 10,
      });

      if (channel !== "ALL") {
        params.append("channel", channel);
      }

      if (status !== "ALL") {
        params.append("status", status);
      }

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(
        `/v1/api/activity?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch activity logs"
        );
      }

      const result = await response.json();

      setLogs(result.data || []);

      setTotalPages(
        result.pagination?.totalPages || 1
      );
    } catch (error) {
      console.error(
        "Activity fetch error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();

    setPage(1);

    fetchLogs();
  };

  const getChannelIcon = (channel) => {
    switch (channel?.toUpperCase()) {
      case "EMAIL":
        return <FiMail />;

      case "WHATSAPP":
        return <FiMessageSquare />;

      case "SMS":
        return <FiMessageSquare />;

      case "PHONE":
        return <FiPhone />;

      default:
        return <FiClock />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "SENT":
      case "DELIVERED":
      case "SUCCESS":
        return <FiCheckCircle />;

      case "FAILED":
      case "ERROR":
        return <FiXCircle />;

      default:
        return <FiClock />;
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="activity-page">

      {/* HEADER */}

      <div className="activity-header">

        <div>
          <h1>Activity & Logs</h1>

          <p>
            Track every communication sent by
            LedgerSync.
          </p>
        </div>

        <button
          className="activity-refresh"
          onClick={fetchLogs}
        >
          <FiRefreshCw />

          Refresh
        </button>

      </div>


      {/* SEARCH / FILTER */}

      <div className="activity-toolbar">

        <form
          className="activity-search"
          onSubmit={handleSearch}
        >
          <FiSearch />

          <input
            type="text"
            placeholder="Search client, email or message..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </form>


        <select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">
            All Channels
          </option>

          <option value="EMAIL">
            Email
          </option>

          <option value="WHATSAPP">
            WhatsApp
          </option>

          <option value="SMS">
            SMS
          </option>

          <option value="PHONE">
            Phone
          </option>
        </select>


        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">
            All Status
          </option>

          <option value="SENT">
            Sent
          </option>

          <option value="DELIVERED">
            Delivered
          </option>

          <option value="FAILED">
            Failed
          </option>
        </select>

      </div>


      {/* TABLE */}

      <div className="activity-card">

        <div className="activity-table-header">

          <span>Communication</span>

          <span>Channel</span>

          <span>Status</span>

          <span>Date</span>

        </div>


        {loading ? (

          <div className="activity-empty">
            <FiRefreshCw />

            Loading activity...
          </div>

        ) : logs.length === 0 ? (

          <div className="activity-empty">

            <FiClock />

            <h3>No activity found</h3>

            <p>
              Communication logs will appear
              here once LedgerSync sends a message.
            </p>

          </div>

        ) : (

          logs.map((log) => (

            <div
              className="activity-row"
              key={log.id}
            >

              {/* MESSAGE */}

              <div className="activity-message">

                <div
                  className={`activity-channel-icon ${log.channel?.toLowerCase()}`}
                >
                  {getChannelIcon(
                    log.channel
                  )}
                </div>

                <div>

                  <strong>
                    {log.subject ||
                      log.templateName ||
                      "Client communication"}
                  </strong>

                  <p>
                    {log.client?.name ||
                      "Unknown client"}
                  </p>

                  {log.content && (
                    <small>
                      {log.content.length > 70
                        ? `${log.content.substring(
                            0,
                            70
                          )}...`
                        : log.content}
                    </small>
                  )}

                </div>

              </div>


              {/* CHANNEL */}

              <div className="activity-channel">

                <span>
                  {log.channel || "-"}
                </span>

              </div>


              {/* STATUS */}

              <div>

                <span
                  className={`activity-status ${log.status?.toLowerCase()}`}
                >
                  {getStatusIcon(
                    log.status
                  )}

                  {log.status || "SENT"}
                </span>

              </div>


              {/* DATE */}

              <div className="activity-date">

                {formatDate(
                  log.sentAt ||
                    log.createdAt
                )}

              </div>

            </div>

          ))
        )}

      </div>


      {/* PAGINATION */}

      <div className="activity-pagination">

        <span>
          Page {page} of {totalPages}
        </span>

        <div>

          <button
            disabled={page <= 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            <FiChevronLeft />
          </button>

          <button
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => p + 1)
            }
          >
            <FiChevronRight />
          </button>

        </div>

      </div>

    </div>
  );
}

export default Activity;