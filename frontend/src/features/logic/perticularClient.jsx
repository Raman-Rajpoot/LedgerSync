import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiFileText,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiMoreVertical,
} from "react-icons/fi";

import getAllClient from "../../services/client.service";
import "../style/perticularClient.css";

function SingleClientCard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllClient.getClient(id);

      setClient(data);

    } catch (err) {
      console.error("Failed to fetch client:", err);

      setError(
        "Unable to load client details."
      );
    } finally {
      setLoading(false);
    }
  };


  /* ==========================================
     DELETE CLIENT
  ========================================== */

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client?"
    );

    if (!confirmDelete) return;

    try {

      await getAllClient.deleteClient(id);

      navigate("/clients");

    } catch (err) {

      console.error(
        "Failed to delete client:",
        err
      );

      alert(
        "Failed to delete client."
      );
    }
  };


  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="client-details-page">

        <div className="client-details-loading">

          <div className="loading-spinner"></div>

          <h3>
            Loading client...
          </h3>

        </div>

      </div>
    );
  }


  /* ==========================================
     ERROR
  ========================================== */

  if (error || !client) {
    return (
      <div className="client-details-page">

        <div className="client-details-error">

          <h2>
            Client not found
          </h2>

          <p>
            {error ||
              "The requested client does not exist."}
          </p>

          <Link
            to="/clients"
            className="back-client-btn"
          >
            <FiArrowLeft />
            Back to Clients
          </Link>

        </div>

      </div>
    );
  }


  /* ==========================================
     NORMALIZE DATA
  ========================================== */

  const company =
    client.companyName ||
    client.company ||
    "No company";

  const email =
    client.email ||
    "No email";

  const phone =
    client.phone ||
    "No phone";

  const address =
    client.address ||
    "No address";

  const invoices =
    client.invoices || [];


  /* ==========================================
     CALCULATIONS
  ========================================== */

  const totalInvoices =
    invoices.length;

  const paidInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status === "PAID"
    ).length;

  const pendingInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status !== "PAID"
    ).length;

  const totalAmount =
    invoices.reduce(
      (total, invoice) =>
        total +
        Number(invoice.amount || 0),
      0
    );


  return (
    <div className="client-details-page">


      {/* ======================================
          HEADER
      ====================================== */}

      <div className="client-details-header">

        <button
          className="back-button"
          onClick={() =>
            navigate("/clients")
          }
        >
          <FiArrowLeft />
          Clients
        </button>


        <div className="details-actions">

          <button
            className="edit-client-btn"
            onClick={() =>
              navigate(
                `/add-client?edit=${client.id}`
              )
            }
          >
            <FiEdit />
            Edit
          </button>


          <button
            className="delete-client-btn"
            onClick={handleDelete}
          >
            <FiTrash2 />
          </button>

        </div>

      </div>


      {/* ======================================
          CLIENT PROFILE
      ====================================== */}

      <div className="client-profile-card">

        <div className="client-profile-left">

          <div className="large-client-avatar">
            {client.name
              ?.charAt(0)
              ?.toUpperCase()}
          </div>


          <div className="client-profile-info">

            <div className="client-name-row">

              <h1>
                {client.name}
              </h1>

              <span className="active-badge">
                {client.status || "Active"}
              </span>

            </div>

            <p className="client-company">
              <FiBriefcase />
              {company}
            </p>

          </div>

        </div>


        <div className="client-contact-actions">

          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="contact-button"
            >
              <FiMail />
              Email
            </a>
          )}

          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="contact-button"
            >
              <FiPhone />
              Call
            </a>
          )}

        </div>

      </div>


      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="client-detail-stats">

        <div className="detail-stat">

          <div className="detail-stat-icon purple">
            <FiFileText />
          </div>

          <div>
            <p>Total Invoices</p>
            <h3>
              {totalInvoices}
            </h3>
          </div>

        </div>


        <div className="detail-stat">

          <div className="detail-stat-icon green">
            ✓
          </div>

          <div>
            <p>Paid</p>
            <h3>
              {paidInvoices}
            </h3>
          </div>

        </div>


        <div className="detail-stat">

          <div className="detail-stat-icon yellow">
            ◷
          </div>

          <div>
            <p>Pending</p>
            <h3>
              {pendingInvoices}
            </h3>
          </div>

        </div>


        <div className="detail-stat">

          <div className="detail-stat-icon blue">
            ₹
          </div>

          <div>
            <p>Total Value</p>
            <h3>
              ₹{totalAmount.toLocaleString("en-IN")}
            </h3>
          </div>

        </div>

      </div>


      {/* ======================================
          CLIENT INFORMATION
      ====================================== */}

      <div className="client-information-card">

        <div className="section-heading">

          <div>
            <h2>
              Client Information
            </h2>

            <p>
              Contact and company details
            </p>
          </div>

        </div>


        <div className="client-information-grid">

          <div className="information-item">

            <span>
              <FiMail />
              Email
            </span>

            <strong>
              {email}
            </strong>

          </div>


          <div className="information-item">

            <span>
              <FiPhone />
              Phone
            </span>

            <strong>
              {phone}
            </strong>

          </div>


          <div className="information-item">

            <span>
              <FiBriefcase />
              Company
            </span>

            <strong>
              {company}
            </strong>

          </div>


          <div className="information-item">

            <span>
              <FiMapPin />
              Address
            </span>

            <strong>
              {address}
            </strong>

          </div>

        </div>

      </div>


      {/* ======================================
          INVOICES
      ====================================== */}

      <div className="client-invoices-card">

        <div className="section-heading">

          <div>

            <h2>
              Invoices
            </h2>

            <p>
              Invoices associated with this client
            </p>

          </div>


          <button className="add-invoice-btn">

            <FiPlus />

            Add Invoice

          </button>

        </div>


        {invoices.length === 0 ? (

          <div className="no-invoices">

            <FiFileText />

            <h3>
              No invoices yet
            </h3>

            <p>
              Create an invoice for this client.
            </p>

          </div>

        ) : (

          <div className="invoice-list">

            <div className="invoice-header">

              <span>INVOICE</span>
              <span>AMOUNT</span>
              <span>DUE DATE</span>
              <span>STATUS</span>
              <span></span>

            </div>


            {invoices.map((invoice) => (

              <div
                className="invoice-row"
                key={invoice.id}
              >

                <div>
                  <strong>
                    {invoice.invoiceNumber ||
                      invoice.id}
                  </strong>
                </div>


                <div>
                  ₹
                  {Number(
                    invoice.amount || 0
                  ).toLocaleString("en-IN")}
                </div>


                <div>
                  {invoice.dueDate
                    ? new Date(
                        invoice.dueDate
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    : "-"}
                </div>


                <div>

                  <span
                    className={`invoice-status ${
                      invoice.status
                        ?.toLowerCase()
                        .replace(" ", "-")
                    }`}
                  >
                    {invoice.status ||
                      "Pending"}
                  </span>

                </div>


                <div>

                  <button className="invoice-more-btn">
                    <FiMoreVertical />
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default SingleClientCard;