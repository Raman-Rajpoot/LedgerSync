import React, { useEffect, useState } from "react";
import {
  FiDollarSign,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import { Navigate } from "react-router-dom";

import "../style/reports.css";
import reportService from "../../services/report.service";

function Reports() {
  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [period, setPeriod] = useState("6months");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchReports();
  }, [period, organizationId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await reportService.getReport();

      if (!response.success) {
        throw new Error("Failed to load reports");
      }

     

      setReport(response.data || null);
    } catch (err) {
      console.error(err);
      setError("Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(
        `/v1/api/reports/export?organizationId=${organizationId}&period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `ledgersync-report-${period}.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Unable to export report.");
    }
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="reports-spinner"></div>
        <h3>Generating report...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-error">
        <h3>{error}</h3>

        <button onClick={fetchReports}>
          <FiRefreshCw />
          Retry
        </button>
      </div>
    );
  }

  /*
   * Temporary fallback data.
   *
   * This makes the page visually usable even before
   * the backend endpoint is implemented.
   */

  const data = report || {
    summary: {
      totalRevenue: 0,
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      overdueInvoices: 0,
    },

    monthlyRevenue: [],

    clientRevenue: [],
  };

  const summary = data.summary || {};

  return (
    <div className="reports-page">

      {/* HEADER */}

      <div className="reports-header">

        <div>
          <h1>Reports</h1>

          <p>
            Understand your business performance,
            revenue and payment collection.
          </p>
        </div>

        <div className="reports-actions">

          <div className="reports-period">

            <FiCalendar />

            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value)
              }
            >
              <option value="30days">
                Last 30 Days
              </option>

              <option value="3months">
                Last 3 Months
              </option>

              <option value="6months">
                Last 6 Months
              </option>

              <option value="12months">
                Last 12 Months
              </option>

            </select>

          </div>

          <button
            className="reports-export"
            onClick={downloadReport}
          >
            <FiDownload />
            Export
          </button>

        </div>

      </div>


      {/* SUMMARY CARDS */}

      <div className="reports-summary">

        <div className="report-card">

          <div className="report-card-icon purple">
            <FiDollarSign />
          </div>

          <div>
            <span>Total Revenue</span>

            <strong>
              ₹{Number(
                summary.totalRevenue || 0
              ).toLocaleString("en-IN")}
            </strong>

            <small>
              Money received
            </small>
          </div>

        </div>


        <div className="report-card">

          <div className="report-card-icon blue">
            <FiFileText />
          </div>

          <div>
            <span>Total Invoiced</span>

            <strong>
              ₹{Number(
                summary.totalInvoiced || 0
              ).toLocaleString("en-IN")}
            </strong>

            <small>
              Invoice value
            </small>
          </div>

        </div>


        <div className="report-card">

          <div className="report-card-icon orange">
            <FiClock />
          </div>

          <div>
            <span>Outstanding</span>

            <strong>
              ₹{Number(
                summary.totalOutstanding || 0
              ).toLocaleString("en-IN")}
            </strong>

            <small>
              Yet to collect
            </small>
          </div>

        </div>


        <div className="report-card">

          <div className="report-card-icon red">
            <FiTrendingUp />
          </div>

          <div>
            <span>Overdue</span>

            <strong>
              ₹{Number(
                summary.totalOverdue || 0
              ).toLocaleString("en-IN")}
            </strong>

            <small>
              Requires attention
            </small>
          </div>

        </div>

      </div>


      {/* SECOND ROW */}

      <div className="reports-grid">


        {/* REVENUE CHART */}

        <div className="reports-panel revenue-panel">

          <div className="panel-header">

            <div>
              <h2>Revenue Overview</h2>

              <p>
                Monthly payment collection
              </p>
            </div>

            <FiTrendingUp />

          </div>


          <div className="revenue-chart">

            {data.monthlyRevenue?.length > 0 ? (

              data.monthlyRevenue.map(
                (item, index) => {

                  const maxRevenue = Math.max(
                    ...data.monthlyRevenue.map(
                      (x) =>
                        Number(x.revenue || 0)
                    ),
                    1
                  );

                  const height =
                    (Number(item.revenue || 0) /
                      maxRevenue) *
                    100;

                  return (
                    <div
                      className="chart-column"
                      key={index}
                    >

                      <div className="chart-value">
                        ₹
                        {Number(
                          item.revenue || 0
                        ).toLocaleString("en-IN")}
                      </div>

                      <div className="chart-bar-wrapper">

                        <div
                          className="chart-bar"
                          style={{
                            height: `${Math.max(
                              height,
                              5
                            )}%`,
                          }}
                        />

                      </div>

                      <span>
                        {item.month}
                      </span>

                    </div>
                  );
                }
              )

            ) : (

              <div className="chart-empty">
                <FiTrendingUp />

                <p>
                  No revenue data available
                </p>
              </div>

            )}

          </div>

        </div>


        {/* INVOICE STATUS */}

        <div className="reports-panel">

          <div className="panel-header">

            <div>
              <h2>Invoice Status</h2>

              <p>
                Current invoice breakdown
              </p>
            </div>

            <FiFileText />

          </div>


          <div className="invoice-status-list">

            <div className="invoice-status-item">

              <div className="status-left">

                <span className="status-dot paid"></span>

                <span>Paid</span>

              </div>

              <strong>
                {summary.paidInvoices || 0}
              </strong>

            </div>


            <div className="invoice-status-item">

              <div className="status-left">

                <span className="status-dot pending"></span>

                <span>Pending</span>

              </div>

              <strong>
                {
                  Math.max(
                    0,
                    (summary.totalInvoices || 0) -
                    (summary.paidInvoices || 0) -
                    (summary.overdueInvoices || 0)
                  )
                }
              </strong>

            </div>


            <div className="invoice-status-item">

              <div className="status-left">

                <span className="status-dot overdue"></span>

                <span>Overdue</span>

              </div>

              <strong>
                {summary.overdueInvoices || 0}
              </strong>

            </div>

          </div>


          <div className="invoice-total">

            <span>Total Invoices</span>

            <strong>
              {summary.totalInvoices || 0}
            </strong>

          </div>

        </div>

      </div>


      {/* CLIENT REVENUE */}

      <div className="reports-panel clients-report">

        <div className="panel-header">

          <div>

            <h2>Top Clients</h2>

            <p>
              Clients generating the most revenue
            </p>

          </div>

          <FiUsers />

        </div>


        <div className="client-report-table">

          <div className="client-report-head">

            <span>CLIENT</span>
            <span>INVOICES</span>
            <span>PAID</span>
            <span>OUTSTANDING</span>
            <span>REVENUE</span>

          </div>


          {data.clientRevenue?.length > 0 ? (

            data.clientRevenue.map(
              (client, index) => (

                <div
                  className="client-report-row"
                  key={client.clientId || index}
                >

                  <div className="report-client">

                    <div className="report-avatar">
                      {client.name
                        ?.charAt(0)
                        ?.toUpperCase() || "C"}
                    </div>

                    <strong>
                      {client.name ||
                        "Unknown Client"}
                    </strong>

                  </div>


                  <span>
                    {client.invoices || 0}
                  </span>

                  <span className="paid-text">
                    ₹{Number(
                      client.paid || 0
                    ).toLocaleString("en-IN")}
                  </span>

                  <span className="outstanding-text">
                    ₹{Number(
                      client.outstanding || 0
                    ).toLocaleString("en-IN")}
                  </span>

                  <strong>
                    ₹{Number(
                      client.revenue || 0
                    ).toLocaleString("en-IN")}
                  </strong>

                </div>

              )
            )

          ) : (

            <div className="report-no-data">
              No client revenue data available.
            </div>

          )}

        </div>

      </div>


      {/* COLLECTION PERFORMANCE */}

      <div className="reports-bottom-grid">

        <div className="reports-panel performance-panel">

          <div className="panel-header">

            <div>

              <h2>
                Collection Performance
              </h2>

              <p>
                How efficiently you're collecting
                invoices
              </p>

            </div>

            <FiCheckCircle />

          </div>


          <div className="collection-score">

            <div className="score-circle">

              <span>
                {
                  summary.totalInvoiced
                    ? Math.round(
                        (summary.totalPaid /
                          summary.totalInvoiced) *
                          100
                      )
                    : 0
                }%
              </span>

            </div>

            <div>

              <strong>
                Collection Rate
              </strong>

              <p>
                Percentage of invoiced amount
                already collected.
              </p>

            </div>

          </div>

        </div>


        <div className="reports-panel quick-stats">

          <div className="panel-header">

            <div>

              <h2>
                Quick Statistics
              </h2>

            </div>

          </div>


          <div className="quick-stat-row">

            <span>
              Total Invoiced
            </span>

            <strong>
              ₹{Number(
                summary.totalInvoiced || 0
              ).toLocaleString("en-IN")}
            </strong>

          </div>


          <div className="quick-stat-row">

            <span>
              Total Paid
            </span>

            <strong className="green-text">
              ₹{Number(
                summary.totalPaid || 0
              ).toLocaleString("en-IN")}
            </strong>

          </div>


          <div className="quick-stat-row">

            <span>
              Outstanding
            </span>

            <strong className="orange-text">
              ₹{Number(
                summary.totalOutstanding || 0
              ).toLocaleString("en-IN")}
            </strong>

          </div>


          <div className="quick-stat-row">

            <span>
              Overdue
            </span>

            <strong className="red-text">
              ₹{Number(
                summary.totalOverdue || 0
              ).toLocaleString("en-IN")}
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Reports;