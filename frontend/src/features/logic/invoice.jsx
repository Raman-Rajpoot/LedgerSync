import React, { useEffect, useMemo, useState } from "react";
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

  const organisationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("All");

  const [openMenu, setOpenMenu] = useState(null);

  const [page, setPage] = useState(1);
  /* ==========================================
     AUTH
  ========================================== */

  if (!token) {
    return <Navigate to="/login" replace />;
  }


  /* ==========================================
     FETCH INVOICES
  ========================================== */

  useEffect(() => {
    fetchInvoices();
  }, [organisationId, status, search, page]);


  const fetchInvoices = async () => {

    try {

      setLoading(true);
      setError("");


      const response = await invoiceService.getAllInvoices({
        status,
        clientId: organisationId,
        search,
        page,
      });

     console.log("Invoice fetch response:", response);
      if (!response.data.success) {
        throw new Error(
          "Failed to fetch invoices"
        );
      }
 
    console.log(response.data);


      const invoiceData =
        Array.isArray(response.data.data)
          ? response.data.data
          : [];


      setInvoices(invoiceData);
      console.log("done...");
    } catch (err) {

      console.error(
        "Invoice fetch error:",
        err
      );

      setError(
        "Failed to load invoices."
      );

    } finally {

      setLoading(false);

    }

  };


  /* ==========================================
     SEARCH + FILTER
  ========================================== */

  const filteredInvoices = useMemo(() => {
  
    return invoices?.filter((invoice) => {

      const invoiceNumber =
        invoice?.invoiceNumber ||
        invoice?.number ||
        invoice?.id ||
        "";

      const clientName =
        invoice?.client?.name ||
        invoice?.clientName ||
        "";

      const searchValue =
        search.toLowerCase().trim();


      const matchesSearch =
        invoiceNumber
          .toString()
          .toLowerCase()
          .includes(searchValue) ||

        clientName
          .toLowerCase()
          .includes(searchValue);


      const invoiceStatus =
        invoice.status || "Pending";


      const matchesStatus =
        status === "All"
          ? true
          : invoiceStatus === status;


      return (
        matchesSearch &&
        matchesStatus
      );

    });

  }, [invoices, search, status]);


  /* ==========================================
     STATS
  ========================================== */

  const totalInvoices =
    invoices.length;


  const paidInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status === "Paid" ||
        invoice.status === "PAID"
    ).length;


  const pendingInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status === "Pending" ||
        invoice.status === "PENDING"
    ).length;


  const overdueInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status === "Overdue" ||
        invoice.status === "OVERDUE"
    ).length;


  const totalAmount =
    invoices.reduce(
      (total, invoice) =>
        total +
        Number(invoice.amount || 0),
      0
    );


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
        await invoiceService.deleteInvoice(invoiceId)


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
              {totalInvoices}
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
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />


          {search && (

            <button
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>

          )}

        </div>


        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
          className="invoice-filter"
        >

          <option value="All">
            All Status
          </option>

          <option value="Paid">
            Paid
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Overdue">
            Overdue
          </option>

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
          filteredInvoices.length === 0 && (

            <div className="invoice-state">

              <div className="empty-invoice-icon">

                <FiFileText />

              </div>

              <h3>
                No invoices found
              </h3>

              <p>
                Create your first invoice to get started.
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
          filteredInvoices.length > 0 && (

            <div className="invoice-list">

              {filteredInvoices.map(
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
                              invoice.createdAt
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

                          {invoiceStatus}

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


                            <Link
                              to={`/invoice/${invoice.id}/edit`}
                              onClick={() =>
                                setOpenMenu(null)
                              }
                            >

                              <FiEdit />

                              Edit

                            </Link>


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