import { useCallback, useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiMail,
  FiPhone,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import "../style/invoiceDetails.css";
import invoiceService from "../../services/invoice.service";

function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [invoice, setInvoice] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  /* =========================================
     FETCH INVOICE
  ========================================= */

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await invoiceService.getInvoice(id);

      if (!response.success) {
        throw new Error(
          "Invoice not found"
        );
      }


      const data = response.data;
      if (!data) throw new Error("Invoice not found");
      setInvoice(data);

    } catch (err) {

      console.error(err);

      setError(err.response?.data?.message || err.message || "Unable to load invoice.");

    } finally {

      setLoading(false);

    }
  }, [id]);

  useEffect(() => {
    if (!token) return undefined;
    const timer = window.setTimeout(fetchInvoice, 0);
    return () => window.clearTimeout(timer);
  }, [fetchInvoice, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }


  /* =========================================
     DELETE
  ========================================= */

  const handleDelete = async () => {
    if(invoice?.status === "PAID" || invoice?.status === "CANCELLED") {
      alert("Cannot delete a paid invoice.");
      return;
    }
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this invoice?"
      );


    if (!confirmed) return;


    try {

      setActionLoading(true);


      const response =
        await invoiceService.deleteInvoice(id);


      if (!response.success) {
        throw new Error(
          "Delete failed"
        );
      }


      navigate("/invoices");

    } catch (err) {

      console.error(err);

      alert(
        "Failed to delete invoice."
      );

    } finally {

      setActionLoading(false);

    }
  };


  /* =========================================
     MARK AS PAID
  ========================================= */

  const handleMarkPaid = async () => {
   
    try {

      setActionLoading(true);


      const response =
        await invoiceService.markPaid(id);


      if (!response.success) {
        throw new Error(
          "Unable to update status"
        );
      }


      await fetchInvoice();

    } catch (err) {

      console.error(err);

      alert(
        "Unable to mark invoice as paid."
      );

    } finally {

      setActionLoading(false);

    }
  };


  /* =========================================
     HELPERS
  ========================================= */

  const formatMoney = (amount) => {

    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  };


  const formatDate = (date) => {

    if (!date) return "-";

    return new Date(date)
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

  };


  const getStatusClass = (value) => (value || "PENDING").toLowerCase();
  const formatStatus = (value) =>
    (value || "PENDING").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());


  /* =========================================
     LOADING
  ========================================= */

  if (loading) {

    return (

      <div className="invoice-details-state">

        <div className="invoice-loading-spinner"></div>

        <h3>
          Loading invoice...
        </h3>

      </div>

    );

  }


  /* =========================================
     ERROR
  ========================================= */

  if (error || !invoice) {

    return (

      <div className="invoice-details-state">

        <FiAlertCircle />

        <h2>
          Invoice not found
        </h2>

        <p>
          {error}
        </p>

        <button type="button" className="back-invoices-btn" onClick={fetchInvoice}>
          Try Again
        </button>

        <Link
          to="/invoices"
          className="back-invoices-btn"
        >
          <FiArrowLeft />
          Back to Invoices
        </Link>

      </div>

    );

  }


  /* =========================================
     DATA
  ========================================= */

  const client =
    invoice.client || {};

  const clientName =
    client.name ||
    invoice.clientName ||
    "Unknown Client";

  const clientEmail =
    client.email ||
    invoice.clientEmail ||
    "";

  const clientPhone =
    client.phone ||
    invoice.clientPhone ||
    "";

  const status =
    invoice.status ||
    "Pending";

  const reminderConfig =
    invoice.reminderConfig ||
    {};


  return (

    <div className="invoice-details-page">


      {/* =====================================
          TOP HEADER
      ===================================== */}

      <div className="invoice-details-top">

        <Link
          to="/invoices"
          className="invoice-back-link"
        >
          <FiArrowLeft />
          Invoices
        </Link>


        <div className="invoice-details-actions">

        { invoice && invoice.status == "PENDING" || invoice.status == "PARTIAL" || invoice.status == "OVERDUE" ? (

          <Link
            to={`/invoice/${id}/edit`}
            className="invoice-edit-btn"
          >
            <FiEdit />
            Edit
          </Link>

        ) : null }
          {status.toUpperCase() !== "PAID" && (

            <button
              className="mark-paid-btn"
              onClick={
                handleMarkPaid
              }
              disabled={
                actionLoading
              }
            >
              <FiCheckCircle />
              Mark as Paid
            </button>

          )}


        { invoice && invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
          <button
            className="invoice-delete-btn"
            onClick={
              handleDelete
            }
            disabled={
              actionLoading
            }
          >
            <FiTrash2 />
          </button>
): null }
        </div>

      </div>


      {/* =====================================
          INVOICE HERO
      ===================================== */}

      <div className="invoice-hero-card">

        <div className="invoice-hero-left">

          <div className="invoice-document-icon">

            <FiFileText />

          </div>


          <div>

            <div className="invoice-title-row">

              <h1>
                {invoice.invoiceNumber ||
                  invoice.number ||
                  `INV-${invoice.id}`}
              </h1>


              <span
                className={`invoice-large-status ${getStatusClass(
                  status
                )}`}
              >
                {formatStatus(status)}
              </span>

            </div>


            <p>
              Created on{" "}
              {formatDate(
                invoice.issueDate
              )}
            </p>

          </div>

        </div>


        <div className="invoice-total-display">

          <span>
            Total Amount
          </span>

          <strong>
            {formatMoney(
              invoice.amount
            )}
          </strong>

        </div>

      </div>


      {/* =====================================
          INFORMATION CARDS
      ===================================== */}

      <div className="invoice-details-grid">


        {/* CLIENT */}

        <div className="invoice-info-card">

          <div className="invoice-info-heading">

            <div className="info-card-icon purple">
              <FiMail />
            </div>

            <div>

              <h2>
                Bill To
              </h2>

              <p>
                Client information
              </p>

            </div>

          </div>


          <div className="client-detail">

            <div className="invoice-client-avatar">

              {clientName
                .charAt(0)
                .toUpperCase()}

            </div>


            <div>

              <h3>
                {clientName}
              </h3>

              {client.companyName && (

                <p>
                  {client.companyName}
                </p>

              )}

            </div>

          </div>


          <div className="contact-detail-list">

            {clientEmail && (

              <a
                href={`mailto:${clientEmail}`}
              >
                <FiMail />
                {clientEmail}
              </a>

            )}


            {clientPhone && (

              <a
                href={`tel:${clientPhone}`}
              >
                <FiPhone />
                {clientPhone}
              </a>

            )}

            {client.project && <p>Project: {client.project}</p>}
            {client.customNotes && <p>{client.customNotes}</p>}

          </div>

        </div>


        {/* DATES */}

        <div className="invoice-info-card">

          <div className="invoice-info-heading">

            <div className="info-card-icon blue">
              <FiCalendar />
            </div>

            <div>

              <h2>
                Dates
              </h2>

              <p>
                Invoice timeline
              </p>

            </div>

          </div>


          <div className="date-detail">

            <div>

              <span>
                Issue Date
              </span>

              <strong>
                {formatDate(
                  invoice.issueDate
                )}
              </strong>

            </div>


            <div>

              <span>
                Due Date
              </span>

              <strong
                className={
                  status.toUpperCase() === "OVERDUE"
                    ? "overdue-text"
                    : ""
                }
              >
                {formatDate(
                  invoice.dueDate
                )}
              </strong>

            </div>

            <div>
              <span>Created</span>
              <strong>{formatDate(invoice.createdAt)}</strong>
            </div>

            <div>
              <span>Last Updated</span>
              <strong>{formatDate(invoice.updatedAt)}</strong>
            </div>

          </div>

        </div>

      </div>


      {/* =====================================
          AMOUNT BREAKDOWN
      ===================================== */}

      <div className="invoice-breakdown-card">

        <div className="details-section-heading">

          <div>

            <h2>
              Amount Breakdown
            </h2>

            <p>
              Complete invoice calculation
            </p>

          </div>

        </div>


        <div className="breakdown-content">

          <div className="breakdown-row">

            <span>
              Subtotal
            </span>

            <strong>
              {formatMoney(
                invoice.subtotal ?? invoice.amount
              )}
            </strong>

          </div>


          <div className="breakdown-row">

            <span>
              Tax
            </span>

            <strong>
              {formatMoney(
                invoice.tax ?? 0
              )}
            </strong>

          </div>


          <div className="breakdown-row">

            <span>
              Discount
            </span>

            <strong>
              - {formatMoney(
                invoice.discount ?? 0
              )}
            </strong>

          </div>


          <div className="breakdown-divider" />


          <div className="breakdown-total">

            <span>
              Total
            </span>

            <strong>
              {formatMoney(
                invoice.amount
              )}
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================
          REMINDER CONFIGURATION
      ===================================== */}

      <div className="reminder-config-card">

        <div className="details-section-heading">

          <div className="reminder-heading">

            <div className="info-card-icon purple">

              <FiFileText />

            </div>


            <div>

              <h2>
                Automatic Reminders
              </h2>

              <p>Scheduled invoice reminders</p>

            </div>

          </div>


        </div>

        <div className="reminder-information">
          <p>
            {reminderConfig.enabled === false
              ? "Automatic reminders are paused."
              : invoice.reminders?.length
                ? `${invoice.reminders.length} reminder(s) scheduled.`
                : "No reminders are currently scheduled."}
          </p>
        </div>

        {invoice.reminders?.length > 0 && (
          <div className="invoice-history-list">
            {invoice.reminders.map((reminder) => (
              <div className="invoice-history-row" key={reminder.id}>
                <div>
                  <strong>{reminder.rule?.name || reminder.rule?.stage || "Reminder"}</strong>
                  <span>{formatDate(reminder.scheduledAt)}</span>
                </div>
                <span>{formatStatus(reminder.status)}</span>
              </div>
            ))}
          </div>
        )}

      </div>

      {invoice.payments?.length > 0 && (
        <div className="invoice-notes-card">
          <div className="details-section-heading">
            <div><h2>Payment History</h2></div>
          </div>
          <div className="invoice-history-list">
            {invoice.payments.map((payment) => (
              <div className="invoice-history-row" key={payment.id}>
                <div>
                  <strong>{formatMoney(payment.amountPaid)}</strong>
                  <span>{payment.method || "Payment"} · {formatDate(payment.paidAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoice.escalationLogs?.length > 0 && (
        <div className="invoice-notes-card">
          <div className="details-section-heading">
            <div><h2>Reminder Delivery History</h2></div>
          </div>
          <div className="invoice-history-list">
            {invoice.escalationLogs.map((log) => (
              <div className="invoice-history-row" key={log.id}>
                <div>
                  <strong>{log.subject || log.channel}</strong>
                  <span>{formatDate(log.sentAt)} · {formatStatus(log.status)}</span>
                  <p>{log.content}</p>
                  {log.response && <small>{log.response}</small>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* =====================================
          NOTES
      ===================================== */}

      {invoice.notes && (

        <div className="invoice-notes-card">

          <div className="details-section-heading">

            <div>

              <h2>
                Notes
              </h2>

            </div>

          </div>

          <p>
            {invoice.notes}
          </p>

        </div>

      )}

    </div>

  );
}

export default InvoiceDetails;