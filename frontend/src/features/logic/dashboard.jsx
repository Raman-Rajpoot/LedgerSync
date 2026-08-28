import React, { useEffect, useState } from "react";
import {
  FiUsers,
  FiFileText,
  FiCreditCard,
  FiAlertCircle,
  FiClock,
  FiArrowUpRight,
  FiArrowDownRight,
  FiRefreshCw,
  FiBell,
  FiActivity,
  FiChevronRight,
} from "react-icons/fi";

import { Navigate, Link } from "react-router-dom";

import "../style/dashboard.css";
import dashboardService from "../../services/dashboard.service";

function Dashboard() {

  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  /* =====================================
     FETCH DASHBOARD
  ===================================== */

  useEffect(() => {

    fetchDashboard();

  }, [organizationId]);


  const fetchDashboard = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await dashboardService.getDashboardStatistics();

      console.log("Dashboard response:", response);
      if (!response.success) {

        throw new Error(
          "Failed to fetch dashboard"
        );

      }



      const data =
        response.data ;


      setDashboard(data);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load dashboard."
      );

    } finally {

      setLoading(false);

    }

  };


  /* =====================================
     FORMAT MONEY
  ===================================== */

  const formatMoney = (amount) => {

    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;

  };


  /* =====================================
     FORMAT DATE
  ===================================== */

  const formatDate = (date) => {

    if (!date) return "--";

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  /* =====================================
     DEFAULT DATA
  ===================================== */

  const stats =
    dashboard?.stats || {};


  const recentInvoices =
    dashboard?.recentInvoices || [];


  const upcomingPayments =
    dashboard?.upcomingPayments || [];


  const activities =
    dashboard?.activities || [];


  const reminders =
    dashboard?.reminders || {};


  /* =====================================
     LOADING
  ===================================== */

  if (loading) {

    return (

      <div className="dashboard-loading">

        <div className="dashboard-spinner" />

        <h3>
          Loading dashboard...
        </h3>

      </div>

    );

  }


  /* =====================================
     ERROR
  ===================================== */

  if (error) {

    return (

      <div className="dashboard-error">

        <FiAlertCircle />

        <h3>
          {error}
        </h3>

        <button
          onClick={
            fetchDashboard
          }
        >
          <FiRefreshCw />

          Try Again
        </button>

      </div>

    );

  }


  return (

    <div className="dashboard-page">


      {/* =================================
          HEADER
      ================================= */}

      <div className="dashboard-header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Here's what's happening
            with your business today.
          </p>

        </div>


        <button
          className="dashboard-refresh"
          onClick={
            fetchDashboard
          }
        >

          <FiRefreshCw />

          Refresh

        </button>

      </div>


      {/* =================================
          STAT CARDS
      ================================= */}

      <div className="dashboard-stats">


        {/* CLIENTS */}

        <div className="dashboard-stat-card">

          <div className="stat-top">

            <div className="stat-icon purple">
              <FiUsers />
            </div>

            <span className="stat-growth positive">
              <FiArrowUpRight />

              {stats.clientGrowth ||
                "0%"}
            </span>

          </div>

          <span className="stat-label">
            Total Clients
          </span>

          <strong className="stat-value">
            {stats.totalClients || 0}
          </strong>

          <p>
            Active clients
          </p>

        </div>


        {/* INVOICES */}

        <div className="dashboard-stat-card">

          <div className="stat-top">

            <div className="stat-icon blue">
              <FiFileText />
            </div>

            <span className="stat-growth positive">
              <FiArrowUpRight />

              {stats.invoiceGrowth ||
                "0%"}
            </span>

          </div>

          <span className="stat-label">
            Total Invoices
          </span>

          <strong className="stat-value">
            {stats.totalInvoices || 0}
          </strong>

          <p>
            This month
          </p>

        </div>


        {/* OUTSTANDING */}

        <div className="dashboard-stat-card">

          <div className="stat-top">

            <div className="stat-icon orange">
              <FiCreditCard />
            </div>

            <span className="stat-growth">
              Outstanding
            </span>

          </div>

          <span className="stat-label">
            Outstanding Amount
          </span>

          <strong className="stat-value money">
            {formatMoney(
              stats.outstandingAmount
            )}
          </strong>

          <p>
            Awaiting payment
          </p>

        </div>


        {/* OVERDUE */}

        <div className="dashboard-stat-card">

          <div className="stat-top">

            <div className="stat-icon red">
              <FiAlertCircle />
            </div>

            <span className="stat-growth negative">
              <FiArrowDownRight />

              {stats.overdueGrowth ||
                "0%"}
            </span>

          </div>

          <span className="stat-label">
            Overdue Amount
          </span>

          <strong className="stat-value money">
            {formatMoney(
              stats.overdueAmount
            )}
          </strong>

          <p>
            Requires attention
          </p>

        </div>

      </div>


      {/* =================================
          MONEY SUMMARY
      ================================= */}

      <div className="money-summary">


        <div className="money-card">

          <div className="money-card-header">

            <div>

              <span>
                Total Revenue
              </span>

              <strong>
                {formatMoney(
                  stats.totalRevenue
                )}
              </strong>

            </div>

            <div className="money-icon green">
              <FiCreditCard />
            </div>

          </div>

          <div className="money-bar">

            <div
              style={{
                width:
                  `${stats.collectionRate || 0}%`,
              }}
            />

          </div>

          <p>
            {stats.collectionRate || 0}%
            payment collection rate
          </p>

        </div>


        <div className="money-card">

          <div className="money-card-header">

            <div>

              <span>
                Pending Payments
              </span>

              <strong>
                {formatMoney(
                  stats.pendingAmount
                )}
              </strong>

            </div>

            <div className="money-icon orange">
              <FiClock />
            </div>

          </div>

          <div className="money-bar orange-bar">

            <div
              style={{
                width:
                  `${stats.pendingRate || 0}%`,
              }}
            />

          </div>

          <p>
            {stats.pendingInvoices || 0}
            {" "}
            invoices awaiting payment
          </p>

        </div>


      </div>


      {/* =================================
          MAIN GRID
      ================================= */}

      <div className="dashboard-grid">


        {/* =================================
            RECENT INVOICES
        ================================= */}

        <div className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                Recent Invoices
              </h2>

              <p>
                Latest invoices created
              </p>

            </div>

            <Link to="/invoices">

              View All

              <FiChevronRight />

            </Link>

          </div>


          <div className="invoice-list">

            {recentInvoices.length === 0 ? (

              <div className="section-empty">

                <FiFileText />

                <p>
                  No invoices yet
                </p>

              </div>

            ) : (

              recentInvoices.map(
                (invoice) => (

                  <Link
                    key={
                      invoice.id
                    }
                    to={`/invoice/${invoice.id}`}
                    className="invoice-row"
                  >

                    <div className="invoice-client-icon">

                      {(
                        invoice.client?.name ||
                        "C"
                      )
                        .charAt(0)
                        .toUpperCase()}

                    </div>


                    <div className="invoice-info">

                      <strong>
                        {invoice.invoiceNumber ||
                          "Invoice"}
                      </strong>

                      <span>
                        {invoice.client?.name ||
                          invoice.clientName ||
                          "Unknown Client"}
                      </span>

                    </div>


                    <div className="invoice-date">

                      <span>
                        Due
                      </span>

                      <strong>
                        {formatDate(
                          invoice.dueDate
                        )}
                      </strong>

                    </div>


                    <div className="invoice-amount">

                      {formatMoney(
                        invoice.amount
                      )}

                    </div>


                    <span
                      className={`invoice-status ${
                        (
                          invoice.status ||
                          ""
                        ).toLowerCase()
                      }`}
                    >
                      {invoice.status ||
                        "Pending"}
                    </span>


                    <FiChevronRight />

                  </Link>

                )
              )

            )}

          </div>

        </div>


        {/* =================================
            REMINDER OVERVIEW
        ================================= */}

        <div className="dashboard-section reminder-overview">

          <div className="section-header">

            <div>

              <h2>
                Reminder Overview
              </h2>

              <p>
                Automatic reminder status
              </p>

            </div>

            <Link to="/reminders">

              Manage

              <FiChevronRight />

            </Link>

          </div>


          <div className="reminder-overview-content">


            <div className="reminder-circle">

              <div>

                <strong>
                  {reminders.total ||
                    0}
                </strong>

                <span>
                  Total
                </span>

              </div>

            </div>


            <div className="reminder-status-list">

              <div>

                <span className="status-dot green-dot" />

                <span>
                  Active
                </span>

                <strong>
                  {reminders.active ||
                    0}
                </strong>

              </div>


              <div>

                <span className="status-dot orange-dot" />

                <span>
                  Scheduled
                </span>

                <strong>
                  {reminders.scheduled ||
                    0}
                </strong>

              </div>


              <div>

                <span className="status-dot red-dot" />

                <span>
                  Overdue
                </span>

                <strong>
                  {reminders.overdue ||
                    0}
                </strong>

              </div>


              <div>

                <span className="status-dot gray-dot" />

                <span>
                  Paused
                </span>

                <strong>
                  {reminders.paused ||
                    0}
                </strong>

              </div>

            </div>

          </div>


          <div className="reminder-alert">

            <FiBell />

            <div>

              <strong>
                {reminders.nextCount ||
                  0}
                {" "}
                reminders scheduled
              </strong>

              <span>
                Next reminder:
                {" "}
                {formatDate(
                  reminders.nextReminderAt
                )}
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* =================================
          BOTTOM GRID
      ================================= */}

      <div className="dashboard-bottom-grid">


        {/* UPCOMING PAYMENTS */}

        <div className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                Upcoming Payments
              </h2>

              <p>
                Payments expected soon
              </p>

            </div>

            <Link to="/payments">

              View All

              <FiChevronRight />

            </Link>

          </div>


          <div className="upcoming-list">

            {upcomingPayments.length ===
            0 ? (

              <div className="section-empty">

                <FiCreditCard />

                <p>
                  No upcoming payments
                </p>

              </div>

            ) : (

              upcomingPayments.map(
                (payment) => (

                  <div
                    className="upcoming-row"
                    key={
                      payment.id
                    }
                  >

                    <div className="payment-date-box">

                      <strong>
                        {new Date(
                          payment.dueDate
                        ).getDate()}
                      </strong>

                      <span>
                        {new Date(
                          payment.dueDate
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            month: "short",
                          }
                        )}
                      </span>

                    </div>


                    <div className="payment-info">

                      <strong>
                        {payment.client?.name ||
                          payment.clientName ||
                          "Unknown"}
                      </strong>

                      <span>
                        {payment.invoiceNumber ||
                          "Invoice"}
                      </span>

                    </div>


                    <strong className="payment-amount">

                      {formatMoney(
                        payment.amount
                      )}

                    </strong>

                  </div>

                )
              )

            )}

          </div>

        </div>


        {/* ACTIVITY */}

        <div className="dashboard-section">

          <div className="section-header">

            <div>

              <h2>
                Recent Activity
              </h2>

              <p>
                Latest system activity
              </p>

            </div>

          </div>


          <div className="activity-list">

            {activities.length ===
            0 ? (

              <div className="section-empty">

                <FiActivity />

                <p>
                  No recent activity
                </p>

              </div>

            ) : (

              activities.map(
                (activity) => (

                  <div
                    className="activity-row"
                    key={
                      activity.id
                    }
                  >

                    <div className="activity-icon">

                      {activity.type ===
                      "PAYMENT"
                        ? <FiCreditCard />
                        : activity.type ===
                          "REMINDER"
                        ? <FiBell />
                        : <FiActivity />}

                    </div>


                    <div>

                      <strong>
                        {activity.title}
                      </strong>

                      <span>
                        {activity.description}
                      </span>

                    </div>


                    <time>
                      {activity.createdAt
                        ? new Date(
                            activity.createdAt
                          ).toLocaleDateString(
                            "en-IN"
                          )
                        : ""}
                    </time>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;