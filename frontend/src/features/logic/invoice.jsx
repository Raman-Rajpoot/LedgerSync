import { useCallback, useEffect, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiMoreVertical,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiEye,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";

import { Link, Navigate } from "react-router-dom";

import "../style/invoice.css";
import invoiceService from "../../services/invoice.service";

function Invoice() {
  const token = localStorage.getItem("token");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const limit = 10;
  /* ==========================================
     FETCH INVOICES
  ========================================== */

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await invoiceService.getAllInvoices({
        status,
        search,
        page,
        limit,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to fetch invoices");
      }
      setInvoices(Array.isArray(response.data.data) ? response.data.data : []);
      setTotal(Number(response.data.total) || 0);
      try {
        const statistics = await invoiceService.getInvoiceStatistics();
        if (statistics.success) setStats(statistics.data);
      } catch (statisticsError) {
        console.error("Invoice statistics error:", statisticsError);
      }
    } catch (err) {
      console.error("Invoice fetch error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, status]);

  useEffect(() => {
    if (!token) return undefined;
    const timer = window.setTimeout(fetchInvoices, 0);
    return () => window.clearTimeout(timer);
  }, [fetchInvoices, token]);


  /* ==========================================
     STATS
  ========================================== */

  const paidInvoices =
    Number(stats?.paidInvoices) || 0;
  const pendingInvoices = Number(stats?.pendingInvoices) || 0;
  const overdueInvoices = Number(stats?.overdueInvoices) || 0;
  const totalAmount = Number(stats?.totalAmount) || 0;


  /* ==========================================
     DELETE
  ========================================== */

  const handleDelete = async (invoiceId) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this invoice?"
      );


    if (!confirmDelete) {
      return;
    }


    try {

      const response =
        await invoiceService.deleteInvoice(invoiceId);


      if (!response.success) {
        throw new Error(
          "Delete failed"
        );
      }


      setInvoices((previous) =>
        previous.filter(
          (invoice) =>
            invoice.id !== invoiceId
        )
      );

        setTotal((current) => Math.max(0, current - 1));
        setOpenMenu(null);

    } catch (err) {

      console.error(err);

      alert(
        "Unable to delete invoice."
      );

    }

  };


  /* ==========================================
     FORMAT DATE
  ========================================== */

  const formatDate = (date) => {

    if (!date) {
      return "-";
    }

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


  /* ==========================================
     FORMAT MONEY
  ========================================== */

  const formatMoney = (amount) => {

    return `₹${Number(amount || 0).toLocaleString(
      "en-IN"
    )}`;

  };


  /* ==========================================
     STATUS CLASS
  ========================================== */

  const getStatusClass = (value) => {

    const normalized =
      (value || "Pending")
        .toLowerCase();

    return normalized;

  };

  const formatStatus = (value) =>
    (value || "PENDING")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  /* ==========================================
     PAGE
  ========================================== */

  return (

    <div className="invoice-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <div className="invoice-header-row">

        <div>

          <h1>
            Invoices
          </h1>

          <p>
            Create, track and manage all your invoices.
          </p>

        </div>


        <Link
          to="/add-invoice"
          className="invoice-add-btn"
        >

          <FiPlus />

          Add Invoice

        </Link>

      </div>


      {/* =====================================
          STATS
      ===================================== */}

      <div className="invoice-stats">


        <div className="invoice-stat-card">

          <div className="invoice-stat-icon purple">

            <FiFileText />

          </div>

          <div>

            <p>
              Total Invoices
            </p>

            <h3>
              {Number(stats?.totalInvoices) || total}
            </h3>

          </div>

        </div>


        <div className="invoice-stat-card">

          <div className="invoice-stat-icon green">

            <FiCheckCircle />

          </div>

          <div>

            <p>
              Paid
            </p>

            <h3>
              {paidInvoices}
            </h3>

          </div>

        </div>


        <div className="invoice-stat-card">

          <div className="invoice-stat-icon yellow">

            <FiClock />

          </div>

          <div>

            <p>
              Pending
            </p>

            <h3>
              {pendingInvoices}
            </h3>

          </div>

        </div>


        <div className="invoice-stat-card">

          <div className="invoice-stat-icon red">

            <FiAlertCircle />

          </div>

          <div>

            <p>
              Overdue
            </p>

            <h3>
              {overdueInvoices}
            </h3>

          </div>

        </div>

      </div>


      {/* =====================================
          TOTAL VALUE
      ===================================== */}

      <div className="invoice-value-card">

        <div>

          <p>
            Total Invoice Value
          </p>

          <h2>
            {formatMoney(totalAmount)}
          </h2>

        </div>


        <div className="invoice-value-icon">

          ₹

        </div>

      </div>


      {/* =====================================
          TOOLBAR
      ===================================== */}

      <div className="invoice-toolbar">


        <div className="invoice-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search invoice or client..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />


          {search && (

            <button
              onClick={() => {
                setPage(1);
                setSearch("");
              }}
            >
              ×
            </button>

          )}

        </div>


        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="invoice-filter"
        >

          <option value="All">
            All Status
          </option>

          <option value="PAID">
            Paid
          </option>

          <option value="PENDING">
            Pending
          </option>

          <option value="OVERDUE">
            Overdue
          </option>
          <option value="PARTIAL">Partial</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="CANCELLED">Cancelled</option>

        </select>


        <button
          className="invoice-refresh"
          onClick={fetchInvoices}
        >

          <FiRefreshCw />

        </button>

      </div>


      {/* =====================================
          TABLE
      ===================================== */}

      <div className="invoice-table-container">


        <div className="invoice-table-head">

          <span>
            INVOICE
          </span>

          <span>
            CLIENT
          </span>

          <span>
            AMOUNT
          </span>

          <span>
            DUE DATE
          </span>

          <span>
            STATUS
          </span>

          <span>
            ACTION
          </span>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="invoice-state">

            <div className="loading-spinner"></div>

            <h3>
              Loading invoices...
            </h3>

            <p>
              Fetching your invoice data.
            </p>

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="invoice-state">

            <FiAlertCircle />

            <h3>
              Unable to load invoices
            </h3>

            <p>
              {error}
            </p>

            <button
              onClick={fetchInvoices}
              className="retry-btn"
            >
              Try Again
            </button>

          </div>

        )}


        {/* EMPTY */}

        {!loading &&
          !error &&
          invoices.length === 0 && (

            <div className="invoice-state">

              <div className="empty-invoice-icon">

                <FiFileText />

              </div>

              <h3>
                No invoices found
              </h3>

              <p>
                {search || status !== "All"
                  ? "Try changing the search or status filter."
                  : "Create your first invoice to get started."}
              </p>


              <Link
                to="/add-invoice"
                className="empty-invoice-btn"
              >

                <FiPlus />

                Create Invoice

              </Link>

            </div>

          )}


        {/* INVOICES */}

        {!loading &&
          !error &&
          invoices.length > 0 && (

            <div className="invoice-list">

              {invoices.map(
                (invoice) => {

                  const invoiceNumber =
                    invoice.invoiceNumber ||
                    invoice.number ||
                    `INV-${invoice.id}`;

                  const clientName =
                    invoice.client?.name ||
                    invoice.clientName ||
                    "Unknown Client";

                  const invoiceStatus =
                    invoice.status ||
                    "Pending";


                  return (

                    <div
                      className="invoice-row"
                      key={invoice.id}
                    >


                      {/* INVOICE */}

                      <div className="invoice-number">

                        <div className="small-invoice-icon">

                          <FiFileText />

                        </div>

                        <div>

                          <strong>
                            {invoiceNumber}
                          </strong>

                          <small>
                            {formatDate(
                              invoice.issueDate
                            )}
                          </small>

                        </div>

                      </div>


                      {/* CLIENT */}

                      <div className="invoice-client">

                        <div className="invoice-avatar">

                          {clientName
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                        <span>
                          {clientName}
                        </span>

                      </div>


                      {/* AMOUNT */}

                      <div className="invoice-amount">

                        {formatMoney(
                          invoice.amount
                        )}

                      </div>


                      {/* DUE DATE */}

                      <div className="invoice-due-date">

                        {formatDate(
                          invoice.dueDate
                        )}

                      </div>


                      {/* STATUS */}

                      <div>

                        <span
                          className={`invoice-status-badge ${getStatusClass(
                            invoiceStatus
                          )}`}
                        >

                          {formatStatus(invoiceStatus)}

                        </span>

                      </div>


                      {/* ACTION */}

                      <div className="invoice-action">

                        <button
                          className="invoice-more-btn"
                          onClick={() =>
                            setOpenMenu(
                              openMenu ===
                                invoice.id
                                ? null
                                : invoice.id
                            )
                          }
                        >

                          <FiMoreVertical />

                        </button>


                        {openMenu ===
                          invoice.id && (

                          <div className="invoice-menu">

                            <Link
                              to={`/invoice/${invoice.id}`}
                              onClick={() =>
                                setOpenMenu(null)
                              }
                            >

                              <FiEye />

                              View

                            </Link>


                           {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                             <Link
                               to={`/invoice/${invoice.id}/edit`}
                               onClick={() =>
                                 setOpenMenu(null)
                               }
                             >

                              <FiEdit />

                              Edit

                            </Link>

               )}
               {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                            <button
                              className="delete-action"
                              onClick={() =>
                                handleDelete(
                                  invoice.id
                                )
                              }
                            >

                              <FiTrash2 />

                              Delete

                            </button>
               )}
                          </div>

                        )}

        {!loading && !error && total > limit && (
                        <div className="invoice-pagination">
                          <span>
                            Showing {(page - 1) * limit + 1}–
                            {Math.min(page * limit, total)} of {total}
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => setPage((current) => Math.max(1, current - 1))}
                              disabled={page === 1}
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              onClick={() => setPage((current) => current + 1)}
                              disabled={page * limit >= total}
                            >
                              Next
                            </button>
                          </div>
                        </div>
        )}

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

      </div>

    </div>

  );

}

export default Invoice;