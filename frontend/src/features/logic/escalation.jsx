import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiMoreVertical,
  FiAlertTriangle,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiRefreshCw,
  FiEye,
  FiTrash2,
} from "react-icons/fi";

import { Navigate } from "react-router-dom";

import "../style/escalation.css";
import escalationService from "../../services/escalation.service";

function Escalation() {

  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [escalations, setEscalations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [channel, setChannel] =
    useState("All");

  const [menuOpen, setMenuOpen] =
    useState(null);

  const [showModal, setShowModal] =
    useState(false);

  const [selectedEscalation, setSelectedEscalation] =
    useState(null);

  const [form, setForm] = useState({
    invoiceId: "",
    channel: "EMAIL",
    content: "",
  });


  if (!token) {
    return <Navigate to="/login" replace />;
  }


  // =========================================
  // FETCH ESCALATIONS
  // =========================================

  useEffect(() => {
    fetchEscalations();
  }, [organizationId]);


  const fetchEscalations = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await escalationService.getAllEscalations();


      if (!response.success) {
        throw new Error(
          "Failed to load escalations"
        );
      }



      setEscalations(
        response.data ||
        []
      );


    } catch (err) {

      console.error(err);

      setError(
        "Unable to load escalations."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================
  // CREATE ESCALATION
  // =========================================

  const createEscalation = async (e) => {

    e.preventDefault();


    try {

      const response = await escalationService.createEscalation({
        invoiceId: form.invoiceId,
        channel: form.channel,
        content: form.content,
      });


      if (!response.success) {

        throw new Error(
          response.message ||
          "Failed to create escalation"
        );

      }


      setShowModal(false);


      setForm({
        invoiceId: "",
        channel: "EMAIL",
        content: "",
      });


      fetchEscalations();


    } catch (err) {

      alert(
        err.message ||
        "Something went wrong"
      );

    }

  };


  // =========================================
  // RESOLVE ESCALATION
  // =========================================

  const resolveEscalation = async (
    id
  ) => {

    try {

      const response =
        await escalationService.updateEscalation(
          id,
          { status: "RESOLVED" }
        );


      if (!response.success) {
        throw new Error(
          "Failed to resolve escalation"
        );
      }


      fetchEscalations();


    } catch (err) {

      alert(
        "Unable to resolve escalation."
      );

    }

  };


  // =========================================
  // DELETE
  // =========================================

  const deleteEscalation = async (
    id
  ) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this escalation?"
      );


    if (!confirmDelete) {
      return;
    }


    try {

      const response =
        await escalationService.deleteEscalation();


      if (!response.success) {
        throw new Error(
          "Delete failed"
        );
      }


      fetchEscalations();


    } catch (err) {

      alert(
        "Unable to delete escalation."
      );

    }

  };


  // =========================================
  // FILTER
  // =========================================

  const filteredEscalations =
    escalations.filter(
      (item) => {

        const clientName =
          item.invoice?.client?.name ||
          item.client?.name ||
          "";

        const invoiceId =
          item.invoice?.id ||
          item.invoiceId ||
          "";

        const matchesSearch =
          clientName
            .toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||

          invoiceId
            .toLowerCase()
            .includes(
              search.toLowerCase()
            );


        const matchesStatus =
          status === "All" ||
          item.status === status;


        const matchesChannel =
          channel === "All" ||
          item.channel === channel;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesChannel
        );

      }
    );


  // =========================================
  // CHANNEL ICON
  // =========================================

  const getChannelIcon = (
    channel
  ) => {

    switch (
      channel?.toUpperCase()
    ) {

      case "EMAIL":
        return <FiMail />;

      case "WHATSAPP":
        return <FiMessageSquare />;

      case "SMS":
        return <FiMessageSquare />;

      case "PHONE":
        return <FiPhone />;

      default:
        return <FiAlertTriangle />;

    }

  };


  // =========================================
  // STATUS
  // =========================================

  const getStatusClass = (
    value
  ) => {

    return (
      value ||
      "PENDING"
    )
      .toLowerCase()
      .replace(
        " ",
        "-"
      );

  };


  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (

      <div className="escalation-loading">

        <div className="escalation-spinner" />

        <h3>
          Loading escalations...
        </h3>

      </div>

    );

  }


  return (

    <div className="escalation-page">


      {/* HEADER */}

      <div className="escalation-header">

        <div>

          <h1>
            Escalations
          </h1>

          <p>
            Manage overdue invoice escalations
            and follow-up actions.
          </p>

        </div>


        <button
          className="escalation-add-btn"
          onClick={() =>
            setShowModal(true)
          }
        >

          <FiPlus />

          New Escalation

        </button>

      </div>


      {/* SUMMARY */}

      <div className="escalation-summary">


        <div className="escalation-stat">

          <div className="stat-icon red">
            <FiAlertTriangle />
          </div>

          <div>

            <span>
              Total
            </span>

            <strong>
              {escalations.length}
            </strong>

          </div>

        </div>


        <div className="escalation-stat">

          <div className="stat-icon orange">
            <FiClock />
          </div>

          <div>

            <span>
              Pending
            </span>

            <strong>
              {
                escalations.filter(
                  (e) =>
                    e.status ===
                    "PENDING"
                ).length
              }
            </strong>

          </div>

        </div>


        <div className="escalation-stat">

          <div className="stat-icon green">
            <FiCheckCircle />
          </div>

          <div>

            <span>
              Resolved
            </span>

            <strong>
              {
                escalations.filter(
                  (e) =>
                    e.status ===
                    "RESOLVED"
                ).length
              }
            </strong>

          </div>

        </div>


        <div className="escalation-stat">

          <div className="stat-icon purple">
            <FiMail />
          </div>

          <div>

            <span>
              Email
            </span>

            <strong>
              {
                escalations.filter(
                  (e) =>
                    e.channel ===
                    "EMAIL"
                ).length
              }
            </strong>

          </div>

        </div>

      </div>


      {/* TOOLBAR */}

      <div className="escalation-toolbar">


        <div className="escalation-search">

          <FiSearch />

          <input
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

          <option value="PENDING">
            Pending
          </option>

          <option value="RESOLVED">
            Resolved
          </option>

        </select>


        <select
          value={channel}
          onChange={(e) =>
            setChannel(
              e.target.value
            )
          }
        >

          <option value="All">
            All Channels
          </option>

          <option value="EMAIL">
            Email
          </option>

          <option value="WHATSAPP">
            WhatsApp
          </option>

          <option value="SMS">
            SMS
          </option>

          <option value="PHONE">
            Phone
          </option>

        </select>


        <button
          className="escalation-refresh"
          onClick={
            fetchEscalations
          }
        >

          <FiRefreshCw />

        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="escalation-error">

          {error}

          <button
            onClick={
              fetchEscalations
            }
          >
            Retry
          </button>

        </div>

      )}


      {/* TABLE */}

      <div className="escalation-table">


        <div className="escalation-table-head">

          <span>
            CLIENT / INVOICE
          </span>

          <span>
            CHANNEL
          </span>

          <span>
            MESSAGE
          </span>

          <span>
            DATE
          </span>

          <span>
            STATUS
          </span>

          <span>
            ACTION
          </span>

        </div>


        {filteredEscalations.length ===
        0 ? (

          <div className="escalation-empty">

            <FiCheckCircle />

            <h3>
              No Escalations Found
            </h3>

            <p>
              There are no escalation
              records matching your filters.
            </p>

          </div>

        ) : (

          filteredEscalations.map(
            (item) => {

              const clientName =
                item.invoice?.client?.name ||
                item.client?.name ||
                "Unknown Client";


              return (

                <div
                  className="escalation-row"
                  key={item.id}
                >


                  {/* CLIENT */}

                  <div className="escalation-client">

                    <div className="client-avatar">

                      {clientName
                        .charAt(0)
                        .toUpperCase()}

                    </div>

                    <div>

                      <strong>
                        {clientName}
                      </strong>

                      <span>
                        Invoice #
                        {
                          item.invoiceId
                            ?.slice(-8) ||
                          "--------"
                        }
                      </span>

                    </div>

                  </div>


                  {/* CHANNEL */}

                  <div className="escalation-channel">

                    {getChannelIcon(
                      item.channel
                    )}

                    <span>
                      {item.channel}
                    </span>

                  </div>


                  {/* MESSAGE */}

                  <div className="escalation-message">

                    {item.content ||
                      "No message"}

                  </div>


                  {/* DATE */}

                  <div className="escalation-date">

                    {item.sentAt
                      ? new Date(
                          item.sentAt
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "--"}

                  </div>


                  {/* STATUS */}

                  <div>

                    <span
                      className={`escalation-status ${getStatusClass(
                        item.status
                      )}`}
                    >

                      {item.status ||
                        "PENDING"}

                    </span>

                  </div>


                  {/* ACTION */}

                  <div className="escalation-action">

                    <button
                      onClick={() =>
                        setSelectedEscalation(
                          item
                        )
                      }
                    >

                      <FiEye />

                    </button>


                    <button
                      onClick={() =>
                        setMenuOpen(
                          menuOpen ===
                          item.id
                            ? null
                            : item.id
                        )
                      }
                    >

                      <FiMoreVertical />

                    </button>


                    {menuOpen ===
                      item.id && (

                      <div className="escalation-menu">

                        {item.status !==
                          "RESOLVED" && (

                          <button
                            onClick={() =>
                              resolveEscalation(
                                item.id
                              )
                            }
                          >

                            <FiCheckCircle />

                            Resolve

                          </button>

                        )}


                        <button
                          className="delete"
                          onClick={() =>
                            deleteEscalation(
                              item.id
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
          )

        )}

      </div>


      {/* CREATE MODAL */}

      {showModal && (

        <div
          className="escalation-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="escalation-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  New Escalation
                </h2>

                <p>
                  Create an escalation
                  for an invoice.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                createEscalation
              }
            >


              <div className="form-group">

                <label>
                  Invoice ID
                </label>

                <input
                  value={
                    form.invoiceId
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      invoiceId:
                        e.target.value,
                    })
                  }
                  placeholder="Enter invoice ID"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Channel
                </label>

                <select
                  value={
                    form.channel
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      channel:
                        e.target.value,
                    })
                  }
                >

                  <option value="EMAIL">
                    Email
                  </option>

                  <option value="WHATSAPP">
                    WhatsApp
                  </option>

                  <option value="SMS">
                    SMS
                  </option>

                  <option value="PHONE">
                    Phone
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label>
                  Message
                </label>

                <textarea
                  rows="5"
                  value={
                    form.content
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content:
                        e.target.value,
                    })
                  }
                  placeholder="Write escalation message..."
                  required
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="save-btn"
                  type="submit"
                >

                  Create Escalation

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* DETAILS MODAL */}

      {selectedEscalation && (

        <div
          className="escalation-modal-overlay"
          onClick={() =>
            setSelectedEscalation(
              null
            )
          }
        >

          <div
            className="escalation-detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="detail-icon">

              <FiAlertTriangle />

            </div>

            <h2>
              Escalation Details
            </h2>

            <p>
              {
                selectedEscalation
                  .content
              }
            </p>

            <div className="detail-info">

              <div>

                <span>
                  Channel
                </span>

                <strong>
                  {
                    selectedEscalation
                      .channel
                  }
                </strong>

              </div>

              <div>

                <span>
                  Status
                </span>

                <strong>
                  {
                    selectedEscalation
                      .status ||
                    "PENDING"
                  }
                </strong>

              </div>

            </div>

            <button
              onClick={() =>
                setSelectedEscalation(
                  null
                )
              }
            >
              Close
            </button>

          </div>

        </div>

      )}

    </div>

  );

}

export default Escalation;