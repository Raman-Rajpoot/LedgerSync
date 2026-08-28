import React, { useEffect, useState } from "react";
import {
  FiBell,
  FiSearch,
  FiPause,
  FiPlay,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";

import {
  Link,
  Navigate,
} from "react-router-dom";

import "../style/reminders.css";
import remindersService from "../../services/reminder.service";

function Reminders() {

  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [reminders, setReminders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [stage, setStage] =
    useState("All");

  const [actionLoading, setActionLoading] =
    useState(false);


  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  /* =========================================
     FETCH REMINDERS
  ========================================= */

  useEffect(() => {
    fetchReminders();
  }, [organizationId]);


  const fetchReminders = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await remindersService.getAllReminders();

      if (!response.success) {
        throw new Error(
          "Failed to load reminders"
        );
      }


      
      const data =
        response.data || [];


      setReminders(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load reminders."
      );

    } finally {

      setLoading(false);

    }
  };


  /* =========================================
     TOGGLE REMINDER
  ========================================= */

  const toggleReminder =
    async (reminder) => {

      try {

        setActionLoading(true);


        const newValue =
          !reminder.enabled;


        const response =
          await remindersService.toggleReminder(
            reminder.id,
            newValue
          );


        if (!response.success) {
          throw new Error(
            "Unable to update reminder"
          );
        }


        setReminders(
          (prev) =>
            prev.map((item) =>
              item.id === reminder.id
                ? {
                    ...item,
                    enabled:
                      newValue,
                  }
                : item
            )
        );

      } catch (err) {

        console.error(err);

        alert(
          "Unable to update reminder."
        );

      } finally {

        setActionLoading(false);

      }
    };


  /* =========================================
     HELPERS
  ========================================= */

  const formatMoney =
    (amount) => {

      return `₹${Number(
        amount || 0
      ).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits:
            2,
        }
      )}`;

    };


  const formatDate =
    (date) => {

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


  const formatDateTime =
    (date) => {

      if (!date) {
        return "-";
      }

      return new Date(date)
        .toLocaleString(
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


  /* =========================================
     FILTER
  ========================================= */

  const filteredReminders =
    reminders.filter(
      (reminder) => {

        const invoice =
          reminder.invoice ||
          {};

        const client =
          invoice.client ||
          {};


        const clientName =
          reminder.clientName ||
          client.name ||
          "";


        const invoiceNumber =
          reminder.invoiceNumber ||
          invoice.invoiceNumber ||
          "";


        const reminderStage =
          reminder.stage ||
          getStage(
            reminder
          );


        const reminderStatus =
          reminder.enabled
            ? "Active"
            : "Paused";


        const searchText =
          search.toLowerCase();


        const matchesSearch =
          clientName
            .toLowerCase()
            .includes(searchText) ||

          invoiceNumber
            .toLowerCase()
            .includes(searchText);


        const matchesStatus =
          status === "All" ||
          reminderStatus === status;


        const matchesStage =
          stage === "All" ||
          reminderStage === stage;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesStage
        );

      }
    );


  /* =========================================
     DETERMINE STAGE
  ========================================= */

  function getStage(reminder) {

    if (
      reminder.stage
    ) {
      return reminder.stage;
    }


    const level =
      Number(
        reminder.reminderLevel ||
        0
      );


    switch (level) {

      case 0:
        return "BEFORE_DUE";

      case 1:
        return "DUE_TODAY";

      case 2:
        return "FIRST_REMINDER";

      case 3:
        return "SECOND_REMINDER";

      case 4:
        return "THIRD_REMINDER";

      case 5:
        return "FINAL_NOTICE";

      default:
        return "LEGAL_NOTICE";

    }

  }


  /* =========================================
     STATISTICS
  ========================================= */

  const activeCount =
    reminders.filter(
      (item) =>
        item.enabled
    ).length;


  const pausedCount =
    reminders.filter(
      (item) =>
        !item.enabled
    ).length;


  const scheduledCount =
    reminders.filter(
      (item) =>
        item.enabled &&
        item.nextReminderAt
    ).length;


  const totalAmount =
    reminders.reduce(
      (sum, reminder) =>
        sum +
        Number(
          reminder.invoice?.amount ||
          reminder.amount ||
          0
        ),
      0
    );


  /* =========================================
     STAGE LABEL
  ========================================= */

  const stageLabel =
    (value) => {

      const labels = {

        BEFORE_DUE:
          "Before Due",

        DUE_TODAY:
          "Due Today",

        FIRST_REMINDER:
          "1st Reminder",

        SECOND_REMINDER:
          "2nd Reminder",

        THIRD_REMINDER:
          "3rd Reminder",

        FINAL_NOTICE:
          "Final Notice",

        LEGAL_NOTICE:
          "Legal Notice",

      };


      return (
        labels[value] ||
        value ||
        "Reminder"
      );

    };


  /* =========================================
     CHANNEL ICON
  ========================================= */

  const ChannelIcon =
    ({ channel }) => {

      if (
        channel === "WHATSAPP"
      ) {
        return (
          <FiMessageSquare />
        );
      }


      if (
        channel === "SMS"
      ) {
        return (
          <FiPhone />
        );
      }


      return (
        <FiMail />
      );

    };


  return (

    <div className="reminders-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <div className="reminders-header">

        <div>

          <h1>
            Reminders
          </h1>

          <p>
            Automatically follow up with
            clients about unpaid invoices.
          </p>

        </div>


        <button
          className="refresh-reminders-btn"
          onClick={
            fetchReminders
          }
          disabled={
            loading
          }
        >

          <FiRefreshCw />

          Refresh

        </button>

      </div>


      {/* =====================================
          STATS
      ===================================== */}

      <div className="reminder-stats">


        <div className="reminder-stat-card">

          <div className="reminder-stat-icon green">

            <FiCheckCircle />

          </div>

          <div>

            <span>
              Active
            </span>

            <strong>
              {activeCount}
            </strong>

          </div>

        </div>


        <div className="reminder-stat-card">

          <div className="reminder-stat-icon orange">

            <FiPause />

          </div>

          <div>

            <span>
              Paused
            </span>

            <strong>
              {pausedCount}
            </strong>

          </div>

        </div>


        <div className="reminder-stat-card">

          <div className="reminder-stat-icon purple">

            <FiClock />

          </div>

          <div>

            <span>
              Scheduled
            </span>

            <strong>
              {scheduledCount}
            </strong>

          </div>

        </div>


        <div className="reminder-stat-card">

          <div className="reminder-stat-icon red">

            <FiBell />

          </div>

          <div>

            <span>
              Invoice Value
            </span>

            <strong>
              {formatMoney(
                totalAmount
              )}
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================
          TOOLBAR
      ===================================== */}

      <div className="reminders-toolbar">


        <div className="reminder-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search client or invoice..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >

          <option value="All">
            All Status
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Paused">
            Paused
          </option>

        </select>


        <select
          value={stage}
          onChange={(e) =>
            setStage(
              e.target.value
            )
          }
        >

          <option value="All">
            All Stages
          </option>

          <option value="BEFORE_DUE">
            Before Due
          </option>

          <option value="DUE_TODAY">
            Due Today
          </option>

          <option value="FIRST_REMINDER">
            1st Reminder
          </option>

          <option value="SECOND_REMINDER">
            2nd Reminder
          </option>

          <option value="THIRD_REMINDER">
            3rd Reminder
          </option>

          <option value="FINAL_NOTICE">
            Final Notice
          </option>

          <option value="LEGAL_NOTICE">
            Legal Notice
          </option>

        </select>

      </div>


      {/* =====================================
          TABLE
      ===================================== */}

      <div className="reminders-table-card">


        <div className="reminders-table-header">

          <div>

            <h2>
              Reminder Queue
            </h2>

            <p>
              {filteredReminders.length}
              {" "}
              invoice reminder(s)
            </p>

          </div>

        </div>


        {loading ? (

          <div className="reminder-state">

            <div className="reminder-spinner"></div>

            <h3>
              Loading reminders...
            </h3>

          </div>

        ) : error ? (

          <div className="reminder-state">

            <FiAlertCircle />

            <h3>
              {error}
            </h3>

            <button
              onClick={
                fetchReminders
              }
            >
              Try Again
            </button>

          </div>

        ) : filteredReminders.length === 0 ? (

          <div className="reminder-state">

            <FiBell />

            <h3>
              No Reminders Found
            </h3>

            <p>
              Reminder configurations will
              appear here for unpaid invoices.
            </p>

          </div>

        ) : (

          <div className="reminders-table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Invoice
                  </th>

                  <th>
                    Client
                  </th>

                  <th>
                    Stage
                  </th>

                  <th>
                    Next Reminder
                  </th>

                  <th>
                    Channel
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredReminders.map(
                  (reminder) => {

                    const invoice =
                      reminder.invoice ||
                      {};

                    const client =
                      invoice.client ||
                      {};


                    const clientName =
                      reminder.clientName ||
                      client.name ||
                      "Unknown";


                    const invoiceNumber =
                      reminder.invoiceNumber ||
                      invoice.invoiceNumber ||
                      `INV-${invoice.id || ""}`;


                    const currentStage =
                      getStage(
                        reminder
                      );


                    const channel =
                      reminder.channel ||
                      reminder.template?.channel ||
                      "EMAIL";


                    return (

                      <tr
                        key={
                          reminder.id
                        }
                      >

                        {/* INVOICE */}

                        <td>

                          <Link
                            to={`/invoice/${
                              invoice.id ||
                              reminder.invoiceId
                            }`}
                            className="reminder-invoice"
                          >

                            <div className="reminder-invoice-icon">

                              <FiBell />

                            </div>

                            <div>

                              <strong>
                                {invoiceNumber}
                              </strong>

                              <span>
                                {formatMoney(
                                  invoice.amount ||
                                  reminder.amount
                                )}
                              </span>

                            </div>

                          </Link>

                        </td>


                        {/* CLIENT */}

                        <td>

                          <div className="reminder-client">

                            <div className="reminder-avatar">

                              {clientName
                                .charAt(
                                  0
                                )
                                .toUpperCase()}

                            </div>

                            <div>

                              <strong>
                                {clientName}
                              </strong>

                              <span>
                                Client
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* STAGE */}

                        <td>

                          <span
                            className={`reminder-stage ${currentStage.toLowerCase()}`}
                          >
                            {stageLabel(
                              currentStage
                            )}
                          </span>

                        </td>


                        {/* NEXT REMINDER */}

                        <td>

                          <div className="next-reminder">

                            <FiClock />

                            <span>
                              {formatDateTime(
                                reminder.nextReminderAt
                              )}
                            </span>

                          </div>

                        </td>


                        {/* CHANNEL */}

                        <td>

                          <div className="reminder-channel">

                            <ChannelIcon
                              channel={
                                channel
                              }
                            />

                            {channel}

                          </div>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`reminder-status ${
                              reminder.enabled
                                ? "active"
                                : "paused"
                            }`}
                          >

                            {reminder.enabled
                              ? "Active"
                              : "Paused"}

                          </span>

                        </td>


                        {/* ACTION */}

                        <td>

                          <div className="reminder-actions">

                            <Link
                              to={`/invoice/${
                                invoice.id ||
                                reminder.invoiceId
                              }`}
                              className="reminder-view-btn"
                            >
                              <FiEye />
                            </Link>


                            <button
                              className={`reminder-pause-btn ${
                                reminder.enabled
                                  ? "pause"
                                  : "play"
                              }`}
                              onClick={() =>
                                toggleReminder(
                                  reminder
                                )
                              }
                              disabled={
                                actionLoading
                              }
                            >

                              {reminder.enabled
                                ? <FiPause />
                                : <FiPlay />}

                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================
          HOW IT WORKS
      ===================================== */}

      <div className="reminder-flow-card">

        <div className="reminder-flow-title">

          <FiBell />

          <div>

            <h2>
              How Automatic Reminders Work
            </h2>

            <p>
              LedgerSync handles the follow-up
              process automatically.
            </p>

          </div>

        </div>


        <div className="reminder-flow">


          <div className="reminder-flow-step">

            <div>
              1
            </div>

            <span>
              Invoice becomes due
            </span>

          </div>


          <div className="flow-line" />


          <div className="reminder-flow-step">

            <div>
              2
            </div>

            <span>
              Scheduler checks invoice
            </span>

          </div>


          <div className="flow-line" />


          <div className="reminder-flow-step">

            <div>
              3
            </div>

            <span>
              Stage is determined
            </span>

          </div>


          <div className="flow-line" />


          <div className="reminder-flow-step">

            <div>
              4
            </div>

            <span>
              Template is selected
            </span>

          </div>


          <div className="flow-line" />


          <div className="reminder-flow-step">

            <div>
              5
            </div>

            <span>
              Message is sent
            </span>

          </div>

        </div>

      </div>

    </div>

  );
}

export default Reminders;