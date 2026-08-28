import React, { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiMail,
  FiPhone,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPause,
  FiPlay,
  FiSend,
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

  const [remindersEnabled, setRemindersEnabled] =
    useState(true);


  if (!token) {
    return <Navigate to="/login" replace />;
  }


  /* =========================================
     FETCH INVOICE
  ========================================= */

  useEffect(() => {
    fetchInvoice();
  }, [id]);


  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError("");

      /*
        Replace with your actual backend
        endpoint if different.
      */

      const response = await invoiceService.getInvoice(id)


      if (!response.success) {
        throw new Error(
          "Invoice not found"
        );
      }


      const data =
        response || {};


      setInvoice(data);


      if (
        data.reminderConfig
      ) {
        setRemindersEnabled(
          data.reminderConfig.enabled
        );
      }

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load invoice."
      );

    } finally {

      setLoading(false);

    }
  };


  /* =========================================
     DELETE
  ========================================= */

  const handleDelete = async () => {

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
        await invoiceService.markInvoicePaid(id);


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
     TOGGLE REMINDERS
  ========================================= */

  const handleReminderToggle =
    async () => {

      const newValue =
        !remindersEnabled;


      try {

        setActionLoading(true);


        /*
          ReminderConfig endpoint.

          Connect this to your actual
          ReminderConfig API.
        */

        const response =
          await fetch(
            `/v1/api/reminders/${id}/toggle`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                enabled:
                  newValue,
              }),
            }
          );


        if (!response.ok) {
          throw new Error(
            "Unable to update reminders"
          );
        }


        setRemindersEnabled(
          newValue
        );

      } catch (err) {

        console.error(err);

        alert(
          "Unable to update reminder settings."
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


  const getStatusClass = (
    status
  ) => {

    return (
      status ||
      "Pending"
    )
      .toLowerCase();

  };


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

          <Link
            to={`/invoice/${id}/edit`}
            className="invoice-edit-btn"
          >
            <FiEdit />
            Edit
          </Link>


          {status !== "Paid" && (

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
                {status}
              </span>

            </div>


            <p>
              Created on{" "}
              {formatDate(
                invoice.createdAt ||
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
                  status === "Overdue"
                    ? "overdue-text"
                    : ""
                }
              >
                {formatDate(
                  invoice.dueDate
                )}
              </strong>

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
                invoice.subtotal ||
                invoice.amount
              )}
            </strong>

          </div>


          <div className="breakdown-row">

            <span>
              Tax
            </span>

            <strong>
              {formatMoney(
                invoice.tax
              )}
            </strong>

          </div>


          <div className="breakdown-row">

            <span>
              Discount
            </span>

            <strong>
              - {formatMoney(
                invoice.discount
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

              {remindersEnabled
                ? <FiPlay />
                : <FiPause />}

            </div>


            <div>

              <h2>
                Automatic Reminders
              </h2>

              <p>
                LedgerSync reminder configuration
              </p>

            </div>

          </div>


          <button
            className={`reminder-toggle ${
              remindersEnabled
                ? "enabled"
                : ""
            }`}
            onClick={
              handleReminderToggle
            }
            disabled={
              actionLoading
            }
          >

            <span></span>

            {remindersEnabled
              ? "Enabled"
              : "Paused"}

          </button>

        </div>


        <div className="reminder-information">


          <div className="reminder-item">

            <span>
              Reminder Level
            </span>

            <strong>
              {reminderConfig.reminderLevel ??
                0}
            </strong>

          </div>


          <div className="reminder-item">

            <span>
              Last Reminder
            </span>

            <strong>
              {formatDate(
                reminderConfig.lastReminderAt
              )}
            </strong>

          </div>


          <div className="reminder-item">

            <span>
              Next Reminder
            </span>

            <strong>
              {formatDate(
                reminderConfig.nextReminderAt
              )}
            </strong>

          </div>


          <div className="reminder-item">

            <span>
              Status
            </span>

            <strong
              className={
                remindersEnabled
                  ? "reminder-active"
                  : "reminder-paused"
              }
            >
              {remindersEnabled
                ? "Automatically running"
                : "Paused"}
            </strong>

          </div>

        </div>


        <div className="reminder-explanation">

          <FiSend />

          <p>
            LedgerSync will automatically check
            this invoice and send the appropriate
            reminder according to your reminder
            rules and templates.
          </p>

        </div>

      </div>


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