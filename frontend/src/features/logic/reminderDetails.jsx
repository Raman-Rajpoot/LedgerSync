import { useCallback, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit,
  FiFileText,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiSave,
  FiX,
} from "react-icons/fi";
import { Link, Navigate, useParams } from "react-router-dom";

import reminderService from "../../services/reminder.service";
import "../style/reminderDetails.css";

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

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

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
}

function getChannelIcon(channel) {
  if (channel === "WHATSAPP") return <FiMessageSquare aria-hidden="true" />;
  if (channel === "SMS") return <FiPhone aria-hidden="true" />;
  return <FiMail aria-hidden="true" />;
}

function ReminderDetails() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchReminder = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await reminderService.getReminder(id);
      if (!response?.success || !response.data) {
        throw new Error(response?.message || "Unable to load reminder.");
      }
      setReminder(response.data);
      setScheduledAt(toLocalDateTime(response.data.scheduledAt));
    } catch (err) {
      console.error("Failed to load reminder:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load reminder."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!token) return undefined;
    const timer = window.setTimeout(fetchReminder, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReminder, token]);

  if (!token) return <Navigate to="/login" replace />;

  const handleSave = async (event) => {
    event.preventDefault();
    if (!scheduledAt) {
      setSaveError("Choose a date and time for this reminder.");
      return;
    }

    try {
      setSaving(true);
      setSaveError("");
      const response = await reminderService.updateReminder(id, {
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      if (!response?.success || !response.data) {
        throw new Error(response?.message || "Unable to update reminder.");
      }
      setReminder(response.data);
      setScheduledAt(toLocalDateTime(response.data.scheduledAt));
      setEditing(false);
    } catch (err) {
      console.error("Failed to update reminder:", err);
      setSaveError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update reminder."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="reminder-detail-state" role="status">
        <div className="reminder-spinner" />
        <p>Loading reminder details...</p>
      </div>
    );
  }

  if (error || !reminder) {
    return (
      <div className="reminder-detail-state" role="alert">
        <FiAlertCircle aria-hidden="true" />
        <h2>{error || "Reminder not found."}</h2>
        <button type="button" onClick={fetchReminder}>Try Again</button>
        <Link to="/reminders">Back to reminders</Link>
      </div>
    );
  }

  const invoice = reminder.invoice || {};
  const client = invoice.client || {};
  const rule = reminder.rule || {};
  const stage = (rule.stage || "Unknown").replaceAll("_", " ");
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const paidTotal = payments.reduce(
    (total, payment) => total + Number(payment.amountPaid || 0),
    0
  );
  const logs = Array.isArray(invoice.escalationLogs)
    ? invoice.escalationLogs
    : [];
  const isPending = reminder.status === "PENDING";

  return (
    <div className="reminder-detail-page">
      <div className="reminder-detail-top">
        <Link to="/reminders" className="reminder-detail-back">
          <FiArrowLeft aria-hidden="true" />
          Back to reminders
        </Link>
        {isPending && !editing && (
          <button
            type="button"
            className="reminder-detail-edit"
            onClick={() => {
              setSaveError("");
              setScheduledAt(toLocalDateTime(reminder.scheduledAt));
              setEditing(true);
            }}
          >
            <FiEdit aria-hidden="true" />
            Edit schedule
          </button>
        )}
      </div>

      <section className="reminder-detail-hero">
        <div className="reminder-detail-hero-icon"><FiBell aria-hidden="true" /></div>
        <div className="reminder-detail-hero-copy">
          <div className="reminder-detail-title">
            <h1>{invoice.invoiceNumber || "Reminder details"}</h1>
            <span className={`reminder-status ${String(reminder.status || "unknown").toLowerCase()}`}>
              {reminder.status || "Unknown"}
            </span>
          </div>
          <p>{client.name || "Unknown client"} · {stage}</p>
        </div>
      </section>

      {editing && (
        <form className="reminder-edit-card" onSubmit={handleSave}>
          <div>
            <h2>Reschedule reminder</h2>
            <p>Choose when this pending reminder should be sent.</p>
          </div>
          <label htmlFor="reminder-scheduled-at">Scheduled date and time</label>
          <input
            id="reminder-scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            required
          />
          {saveError && <p className="reminder-edit-error" role="alert">{saveError}</p>}
          <div className="reminder-edit-actions">
            <button type="button" className="secondary" onClick={() => setEditing(false)} disabled={saving}>
              <FiX aria-hidden="true" /> Cancel
            </button>
            <button type="submit" disabled={saving}>
              <FiSave aria-hidden="true" /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}

      <div className="reminder-detail-grid">
        <section className="reminder-detail-card">
          <div className="reminder-detail-card-heading">
            <FiCalendar aria-hidden="true" />
            <h2>Schedule and delivery</h2>
          </div>
          <dl className="reminder-detail-list">
            <div><dt>Scheduled for</dt><dd>{formatDateTime(reminder.scheduledAt)}</dd></div>
            <div><dt>Stage</dt><dd>{stage}</dd></div>
            <div><dt>Channel</dt><dd className="reminder-detail-channel">{getChannelIcon(rule.channel)}{rule.channel || "-"}</dd></div>
            <div><dt>Status</dt><dd>{reminder.status || "-"}</dd></div>
            <div><dt>Attempts</dt><dd>{reminder.attempts ?? 0}</dd></div>
            <div><dt>Sent at</dt><dd>{formatDateTime(reminder.sentAt)}</dd></div>
            <div><dt>Created</dt><dd>{formatDateTime(reminder.createdAt)}</dd></div>
            {reminder.failedAt && <div><dt>Failed at</dt><dd>{formatDateTime(reminder.failedAt)}</dd></div>}
          </dl>
          {reminder.errorMessage && (
            <div className="reminder-detail-error"><FiAlertCircle aria-hidden="true" />{reminder.errorMessage}</div>
          )}
          {!isPending && (
            <p className="reminder-detail-note"><FiCheckCircle aria-hidden="true" /> Only pending reminders can be rescheduled.</p>
          )}
        </section>

        <section className="reminder-detail-card">
          <div className="reminder-detail-card-heading">
            <FiFileText aria-hidden="true" />
            <h2>Invoice</h2>
          </div>
          <dl className="reminder-detail-list">
            <div><dt>Invoice number</dt><dd>{invoice.id ? <Link to={`/invoice/${invoice.id}`}>{invoice.invoiceNumber || invoice.id}</Link> : invoice.invoiceNumber || "-"}</dd></div>
            <div><dt>Total amount</dt><dd>{formatMoney(invoice.amount)}</dd></div>
            <div><dt>Paid</dt><dd>{formatMoney(paidTotal)}</dd></div>
            <div><dt>Issue date</dt><dd>{formatDate(invoice.issueDate)}</dd></div>
            <div><dt>Due date</dt><dd>{formatDate(invoice.dueDate)}</dd></div>
            <div><dt>Invoice status</dt><dd>{invoice.status || "-"}</dd></div>
          </dl>
        </section>

        <section className="reminder-detail-card">
          <div className="reminder-detail-card-heading">
            <FiMail aria-hidden="true" />
            <h2>Client</h2>
          </div>
          <dl className="reminder-detail-list">
            <div><dt>Name</dt><dd>{client.name || "-"}</dd></div>
            <div><dt>Company</dt><dd>{client.companyName || "-"}</dd></div>
            <div><dt>Email</dt><dd>{client.email || "-"}</dd></div>
            <div><dt>Phone</dt><dd>{client.phone || "-"}</dd></div>
          </dl>
        </section>

        <section className="reminder-detail-card">
          <div className="reminder-detail-card-heading">
            <FiClock aria-hidden="true" />
            <h2>Reminder rule and message</h2>
          </div>
          <dl className="reminder-detail-list">
            <div><dt>Rule</dt><dd>{rule.name || "-"}</dd></div>
            <div><dt>Stage</dt><dd>{stage}</dd></div>
            <div><dt>Relative day</dt><dd>{Number.isFinite(rule.daysOffset) ? `${rule.daysOffset > 0 ? "+" : ""}${rule.daysOffset} days from due date` : "-"}</dd></div>
            <div><dt>Template</dt><dd>{rule.template?.name || "-"}</dd></div>
            {rule.template?.subject && <div><dt>Subject</dt><dd>{rule.template.subject}</dd></div>}
          </dl>
          <p className="reminder-detail-message">{rule.template?.content || "No message template available."}</p>
        </section>
      </div>

      <section className="reminder-detail-card reminder-delivery-card">
        <div className="reminder-detail-card-heading">
          <FiMessageSquare aria-hidden="true" />
          <h2>Delivery history</h2>
        </div>
        {logs.length ? (
          <div className="reminder-delivery-list">
            {logs.map((log) => (
              <article key={log.id} className="reminder-delivery-row">
                <div>
                  <strong>{log.channel || "Message"} · {log.status || "Unknown"}</strong>
                  <span>{formatDateTime(log.sentAt)}</span>
                </div>
                <p>{log.content || "No message content available."}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="reminder-detail-empty">No delivery history is available for this invoice.</p>
        )}
      </section>
    </div>
  );
}

export default ReminderDetails;
