import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiEye,
  FiCalendar,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";

import { Link, Navigate } from "react-router-dom";

import "../style/payment.css";
import paymentService from "../../services/payment.service";

function Payments() {
  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [payments, setPayments] = useState([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("All");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  /* =========================================
     FETCH PAYMENTS
  ========================================= */

  useEffect(() => {
    fetchPayments();
  }, [organizationId, page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await paymentService.getAllPayments({
        page,
        limit,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to load payments"
        );
      }

      /*
        Expected response:

        {
          success: true,
          total: 20,
          page: 1,
          limit: 10,
          data: [...]
        }
      */

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setPayments(data);

      setTotal(
        Number(response.total || 0)
      );

    } catch (err) {
      console.error(
        "Payment fetch error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load payments."
      );

    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     HELPERS
  ========================================= */

  const formatMoney = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================
     NORMALIZE PAYMENT
  ========================================= */

  const getPaymentData = (payment) => {
    const invoice = payment?.invoice || {};
    const client = invoice?.client || {};

    const invoiceNumber =
      payment?.invoiceNumber ||
      invoice?.invoiceNumber ||
      (invoice?.id
        ? `INV-${String(invoice.id).slice(-6)}`
        : "Invoice");

    const clientName =
      payment?.clientName ||
      client?.name ||
      "Unknown Client";

    const paymentMethod =
      payment?.paymentMethod ||
      payment?.method ||
      "-";

    /*
      Your backend creates payments through:

      payment.create({
        invoiceId,
        amount,
        paymentMethod,
        transactionId,
        notes
      })

      Therefore payment itself may not have
      a status.

      We derive the display status from
      the related invoice.
    */

    let paymentStatus = "Completed";

    if (payment?.status) {
      paymentStatus = payment.status;
    } else if (invoice?.status) {
      if (invoice.status === "PAID") {
        paymentStatus = "Completed";
      } else if (invoice.status === "PENDING") {
        paymentStatus = "Pending";
      } else if (invoice.status === "OVERDUE") {
        paymentStatus = "Failed";
      } else if (invoice.status === "PARTIAL") {
        paymentStatus = "Completed";
      }
    }

    return {
      invoice,
      client,
      invoiceNumber,
      clientName,
      paymentMethod,
      paymentStatus,
    };
  };

  /* =========================================
     FILTER
  ========================================= */

  const filteredPayments = payments.filter(
    (payment) => {
      const {
        invoiceNumber,
        clientName,
        paymentMethod,
        paymentStatus,
      } = getPaymentData(payment);

      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        invoiceNumber
          .toLowerCase()
          .includes(searchText) ||
        clientName
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        status === "All" ||
        paymentStatus === status;

      const normalizedMethod =
        paymentMethod.toLowerCase();

      const matchesMethod =
        method === "All" ||
        normalizedMethod ===
          method.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );
    }
  );

  /* =========================================
     STATISTICS
  ========================================= */

  const totalCollected = payments.reduce(
    (sum, payment) => {
      const {
        paymentStatus,
      } = getPaymentData(payment);

      if (
        paymentStatus === "Completed"
      ) {
        return (
          sum +
          Number(payment?.amount || 0)
        );
      }

      return sum;
    },
    0
  );

  const pendingAmount = payments.reduce(
    (sum, payment) => {
      const {
        paymentStatus,
      } = getPaymentData(payment);

      if (
        paymentStatus === "Pending"
      ) {
        return (
          sum +
          Number(payment?.amount || 0)
        );
      }

      return sum;
    },
    0
  );

  const failedAmount = payments.reduce(
    (sum, payment) => {
      const {
        paymentStatus,
      } = getPaymentData(payment);

      if (
        paymentStatus === "Failed"
      ) {
        return (
          sum +
          Number(payment?.amount || 0)
        );
      }

      return sum;
    },
    0
  );

  const completedCount =
    payments.filter((payment) => {
      const {
        paymentStatus,
      } = getPaymentData(payment);

      return paymentStatus === "Completed";
    }).length;

  /* =========================================
     PAGINATION
  ========================================= */

  const totalPages =
    Math.ceil(total / limit);

  const hasPreviousPage = page > 1;
  const hasNextPage =
    page < totalPages;

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  /* =========================================
     RESET PAGE WHEN FILTERING
  ========================================= */

  useEffect(() => {
    setPage(1);
  }, [search, status, method]);

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="payments-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="payments-header">

        <div>
          <h1>
            Payments
          </h1>

          <p>
            Track and manage all payments
            received from your clients.
          </p>
        </div>

        <button
          className="refresh-payment-btn"
          onClick={fetchPayments}
          disabled={loading}
        >
          <FiRefreshCw
            className={
              loading
                ? "payment-refresh-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>

      {/* =====================================
          STATISTICS
      ===================================== */}

      <div className="payment-stats">

        <div className="payment-stat-card">

          <div className="payment-stat-icon green">
            <FiCheckCircle />
          </div>

          <div>
            <span>
              Total Collected
            </span>

            <strong>
              {formatMoney(
                totalCollected
              )}
            </strong>
          </div>

        </div>

        <div className="payment-stat-card">

          <div className="payment-stat-icon orange">
            <FiClock />
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {formatMoney(
                pendingAmount
              )}
            </strong>
          </div>

        </div>

        <div className="payment-stat-card">

          <div className="payment-stat-icon red">
            <FiAlertCircle />
          </div>

          <div>
            <span>
              Failed
            </span>

            <strong>
              {formatMoney(
                failedAmount
              )}
            </strong>
          </div>

        </div>

        <div className="payment-stat-card">

          <div className="payment-stat-icon purple">
            <FiCreditCard />
          </div>

          <div>
            <span>
              Successful Payments
            </span>

            <strong>
              {completedCount}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================
          SEARCH / FILTER
      ===================================== */}

      <div className="payments-toolbar">

        <div className="payment-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search invoice or client..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="payment-filter">

          <FiFilter />

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Failed">
              Failed
            </option>

          </select>

        </div>

        <div className="payment-filter">

          <FiCreditCard />

          <select
            value={method}
            onChange={(e) =>
              setMethod(e.target.value)
            }
          >
            <option value="All">
              All Methods
            </option>

            <option value="UPI">
              UPI
            </option>

            <option value="Bank Transfer">
              Bank Transfer
            </option>

            <option value="Cash">
              Cash
            </option>

            <option value="Card">
              Card
            </option>

          </select>

        </div>

      </div>

      {/* =====================================
          TABLE
      ===================================== */}

      <div className="payments-table-card">

        <div className="payments-table-header">

          <div>
            <h2>
              Payment History
            </h2>

            <p>
              {filteredPayments.length}
              {" "}
              payment(s)
            </p>
          </div>

        </div>

        {loading ? (

          <div className="payment-state">

            <div className="payment-spinner"></div>

            <h3>
              Loading payments...
            </h3>

          </div>

        ) : error ? (

          <div className="payment-state">

            <FiAlertCircle />

            <h3>
              {error}
            </h3>

            <button
              onClick={fetchPayments}
              className="retry-payment-btn"
            >
              Try Again
            </button>

          </div>

        ) : filteredPayments.length === 0 ? (

          <div className="payment-state">

            <FiCreditCard />

            <h3>
              No Payments Found
            </h3>

            <p>
              Payments will appear here
              once they are recorded.
            </p>

          </div>

        ) : (

          <>

            <div className="payment-table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Payment
                    </th>

                    <th>
                      Client
                    </th>

                    <th>
                      Invoice
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Method
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredPayments.map(
                    (payment) => {

                      const {
                        invoice,
                        client,
                        clientName,
                        invoiceNumber,
                        paymentMethod,
                        paymentStatus,
                      } =
                        getPaymentData(
                          payment
                        );

                      const invoiceId =
                        invoice?.id ||
                        payment?.invoiceId;

                      return (

                        <tr
                          key={
                            payment.id
                          }
                        >

                          {/* PAYMENT */}

                          <td>

                            <div className="payment-id">

                              <div className="payment-row-icon">
                                <FiCreditCard />
                              </div>

                              <div>

                                <strong>
                                  {payment.id
                                    ? `PAY-${String(
                                        payment.id
                                      ).slice(-6)}`
                                    : "Payment"}
                                </strong>

                                <span>
                                  Payment received
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* CLIENT */}

                          <td>

                            <div className="payment-client">

                              <div className="payment-avatar">

                                {clientName
                                  .charAt(0)
                                  .toUpperCase()}

                              </div>

                              <div>

                                <strong>
                                  {clientName}
                                </strong>

                                <span>
                                  <FiUser />
                                  Client
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* INVOICE */}

                          <td>

                            {invoiceId ? (

                              <Link
                                to={`/invoice/${invoiceId}`}
                                className="payment-invoice-link"
                              >
                                {invoiceNumber}
                              </Link>

                            ) : (

                              <span>
                                {invoiceNumber}
                              </span>

                            )}

                          </td>

                          {/* DATE */}

                          <td>

                            <div className="payment-date">

                              <FiCalendar />

                              {formatDate(
                                payment?.paidAt ||
                                payment?.createdAt
                              )}

                            </div>

                          </td>

                          {/* METHOD */}

                          <td>

                            <span className="payment-method">

                              {paymentMethod}

                            </span>

                          </td>

                          {/* AMOUNT */}

                          <td>

                            <strong className="payment-amount">

                              {formatMoney(
                                payment?.amount
                              )}

                            </strong>

                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`payment-status ${
                                paymentStatus
                                  .toLowerCase()
                                  .replace(
                                    /\s+/g,
                                    "-"
                                  )
                              }`}
                            >

                              {paymentStatus}

                            </span>

                          </td>

                          {/* ACTION */}

                          <td>

                            {invoiceId && (

                              <Link
                                to={`/invoice/${invoiceId}`}
                                className="payment-view-btn"
                                title="View Invoice"
                              >
                                <FiEye />
                              </Link>

                            )}

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

            {/* =====================================
                PAGINATION
            ===================================== */}

            {totalPages > 1 && (

              <div className="payments-pagination">

                <button
                  onClick={
                    goToPreviousPage
                  }
                  disabled={
                    !hasPreviousPage ||
                    loading
                  }
                >
                  Previous
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={
                    goToNextPage
                  }
                  disabled={
                    !hasNextPage ||
                    loading
                  }
                >
                  Next
                </button>

              </div>

            )}

          </>

        )}

      </div>

    </div>
  );
}

export default Payments;