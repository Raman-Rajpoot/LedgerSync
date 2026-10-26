import React, { useCallback, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBell,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { Link, Navigate } from "react-router-dom";

import "../style/reminders.css";
import remindersService from "../../services/reminder.service";

const stages = [
  "BEFORE_DUE",
  "DUE_TODAY",
  "FIRST_REMINDER",
  "SECOND_REMINDER",
  "THIRD_REMINDER",
  "FINAL_NOTICE",
  "LEGAL_NOTICE",
];

const statuses = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "FAILED",
  "CANCELLED",
];

const stageLabels = {
  BEFORE_DUE: "Before Due",
  DUE_TODAY: "Due Today",
  FIRST_REMINDER: "1st Reminder",
  SECOND_REMINDER: "2nd Reminder",
  THIRD_REMINDER: "3rd Reminder",
  FINAL_NOTICE: "Final Notice",
  LEGAL_NOTICE: "Legal Notice",
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getChannelIcon(channel) {
  if (channel === "WHATSAPP") return <FiMessageSquare aria-hidden="true" />;
  if (channel === "SMS") return <FiPhone aria-hidden="true" />;
  return <FiMail aria-hidden="true" />;
}

function Reminders() {
  const token = localStorage.getItem("token");
  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [stage, setStage] = useState("All");

  const fetchReminders = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await remindersService.getAllReminders();
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error(response?.message || "Unable to load reminders.");
      }

      setReminders(response.data);
    } catch (err) {
      console.error("Failed to load reminders:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load reminders."
      );
    } finally {
      setLoading(false);
    }
  }, [token, organizationId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const searchText = search.trim().toLocaleLowerCase();
  const filteredReminders = reminders.filter((reminder) => {
    const invoice = reminder.invoice || {};
    const client = invoice.client || {};
    const message = reminder.rule?.template?.content || "";
    const searchable = [
      invoice.invoiceNumber,
      client.name,
      message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    return (
      (!searchText || searchable.includes(searchText)) &&
      (status === "All" || reminder.status === status) &&
      (stage === "All" || reminder.rule?.stage === stage)
    );
  });

  const countStatus = (value) =>
    reminders.filter((reminder) => reminder.status === value).length;
  const scheduledCount = reminders.filter(
    (reminder) =>
      reminder.status === "PENDING" &&
      reminder.scheduledAt &&
      new Date(reminder.scheduledAt).getTime() >= Date.now()
  ).length;

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  return (
    <div className="reminders-page">
      <div className="reminders-header">
        <div>
          <h1>Reminders</h1>
          <p>Follow-up messages scheduled for unpaid invoices.</p>
        </div>
        <button
          className="refresh-reminders-btn"
          onClick={fetchReminders}
          disabled={loading}
          type="button"
        >
          <FiRefreshCw aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="reminder-stats">
        <div className="reminder-stat-card">
          <div className="reminder-stat-icon orange">
            <FiClock />
          </div>
          <div>
            <span>Pending</span>
            <strong>{countStatus("PENDING")}</strong>
          </div>
        </div>
        <div className="reminder-stat-card">
          <div className="reminder-stat-icon green">
            <FiCheckCircle />
          </div>
          <div>
            <span>Sent</span>
            <strong>{countStatus("SENT")}</strong>
          </div>
        </div>
        <div className="reminder-stat-card">
          <div className="reminder-stat-icon red">
            <FiAlertCircle />
          </div>
          <div>
            <span>Failed</span>
            <strong>{countStatus("FAILED")}</strong>
          </div>
        </div>
        <div className="reminder-stat-card">
          <div className="reminder-stat-icon purple">
            <FiBell />
          </div>
          <div>
            <span>Scheduled</span>
            <strong>{scheduledCount}</strong>
          </div>
        </div>
      </div>

      <div className="reminders-toolbar">
        <div className="reminder-search">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            placeholder="Search client, invoice, or message..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Filter by reminder status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="All">All Statuses</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by reminder stage"
          value={stage}
          onChange={(event) => setStage(event.target.value)}
        >
          <option value="All">All Stages</option>
          {stages.map((value) => (
            <option key={value} value={value}>
              {stageLabels[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="reminders-table-card">
        <div className="reminders-table-header">
          <div>
            <h2>Reminder Queue</h2>
            <p>
              {filteredReminders.length} reminder
              {filteredReminders.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="reminder-state" role="status">
            <div className="reminder-spinner" />
            <h3>Loading reminders...</h3>
          </div>
        ) : error ? (
          <div className="reminder-state" role="alert">
            <FiAlertCircle />
            <h3>{error}</h3>
            <button onClick={fetchReminders} type="button">
              Try Again
            </button>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="reminder-state">
            <FiBell />
            <h3>No Reminders Found</h3>
            <p>
              {reminders.length
                ? "No reminders match the selected filters."
                : "Scheduled reminders for this organization will appear here."}
            </p>
          </div>
        ) : (
          <div className="reminders-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Stage</th>
                  <th>Scheduled Date</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders.map((reminder) => {
                  const invoice = reminder.invoice || {};
                  const client = invoice.client || {};
                  const currentStage = reminder.rule?.stage || "Unknown";
                  const channel = reminder.rule?.channel || "Unknown";
                  const message =
                    reminder.rule?.template?.content || "No message template";

                  return (
                    <tr key={reminder.id}>
                      <td>
                        {invoice.id ? (
                          <Link
                            to={`/invoice/${invoice.id}`}
                            className="reminder-invoice"
                          >
                            <div className="reminder-invoice-icon">
                              <FiBell />
                            </div>
                            <div>
                              <strong>
                                {invoice.invoiceNumber || invoice.id}
                              </strong>
                              <span>{formatMoney(invoice.amount)}</span>
                            </div>
                          </Link>
                        ) : (
                          invoice.invoiceNumber || "Invoice unavailable"
                        )}
                      </td>
                      <td>
                        <div className="reminder-client">
                          <div className="reminder-avatar">
                            {(client.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{client.name || "Unknown client"}</strong>
                            <span>{client.email || client.phone || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`reminder-stage ${currentStage.toLowerCase()}`}
                        >
                          {stageLabels[currentStage] || currentStage}
                        </span>
                      </td>
                      <td>
                        <div className="next-reminder">
                          <FiClock aria-hidden="true" />
                          <span>{formatDateTime(reminder.scheduledAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="reminder-channel">
                          {getChannelIcon(channel)}
                          {channel}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`reminder-status ${String(
                            reminder.status || "unknown"
                          ).toLowerCase()}`}
                        >
                          {reminder.status || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <span className="reminder-message" title={message}>
                          {message}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reminders;
