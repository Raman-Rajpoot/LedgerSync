import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiSave,
  FiUser,
  FiCalendar,
  FiFileText,
  // FiIndianRupee,
  FiPlus,
} from "react-icons/fi";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import "../style/addInvoice.css";
import getAllClient from "../../services/client.service";
import invoiceService from "../../services/invoice.service";

function AddInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const token = localStorage.getItem("token");

  const organisationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [clients, setClients] = useState([]);

  const [loadingClients, setLoadingClients] =
    useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(isEditing);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    clientId: searchParams.get("clientId") || "",
    invoiceNumber: "",
    issueDate: new Date()
      .toISOString()
      .split("T")[0],
    dueDate: "",
    amount: "",
    tax: "0",
    discount: "0",
    notes: "",
  });


  /* =========================================
     LOAD CLIENTS
  ========================================= */

  useEffect(() => {
    if (!token) return;

    const fetchClients = async () => {
      try {
        setLoadingClients(true);

        const data = await getAllClient.getAllClient(organisationId);

        setClients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load clients:", err);
        setError("Unable to load clients.");
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [organisationId, token]);

  useEffect(() => {
    if (!token || !id) return;

    const fetchInvoice = async () => {
      try {
        setLoadingInvoice(true);
        const response = await invoiceService.getInvoice(id);
        if (!response.success || !response.data) {
          throw new Error(response.message || "Invoice not found");
        }

        const invoice = response.data;
        const subtotal = Number(invoice.subtotal ?? invoice.amount ?? 0);
        const tax = Number(invoice.tax ?? 0);
        const discount = Number(invoice.discount ?? 0);
        setForm({
          clientId: invoice.clientId || "",
          invoiceNumber: invoice.invoiceNumber || "",
          issueDate: new Date(invoice.issueDate).toISOString().split("T")[0],
          dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
          amount: String(subtotal),
          tax: subtotal > 0 ? String((tax / subtotal) * 100) : "0",
          discount: subtotal > 0 ? String((discount / subtotal) * 100) : "0",
          notes: invoice.notes || "",
        });
      } catch (err) {
        console.error("Failed to load invoice:", err);
        setError(err.response?.data?.message || err.message || "Unable to load invoice.");
      } finally {
        setLoadingInvoice(false);
      }
    };

    fetchInvoice();
  }, [id, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }


  /* =========================================
     FORM CHANGE
  ========================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* =========================================
     CALCULATIONS
  ========================================= */

  const amount =
    Number(form.amount) || 0;

  const tax =
    Number(form.tax) || 0;

  const discount =
    Number(form.discount) || 0;

  const taxAmount =
    (amount * tax) / 100;

  const discountAmount =
    (amount * discount) / 100;

  const total =
    amount +
    taxAmount -
    discountAmount;


  /* =========================================
     SUBMIT
  ========================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");


    /* Validation */

    if (!form.clientId) {
      setError(
        "Please select a client."
      );
      return;
    }

    if (!form.amount || amount <= 0) {
      setError(
        "Please enter a valid amount."
      );
      return;
    }

    if (
      !Number.isFinite(tax) ||
      !Number.isFinite(discount) ||
      tax < 0 ||
      discount < 0 ||
      discount > 100
    ) {
      setError("Tax must be non-negative and discount must be between 0 and 100%.");
      return;
    }

    if (!form.dueDate) {
      setError(
        "Please select a due date."
      );
      return;
    }


    try {

      setSaving(true);


      const invoiceData = {
        clientId: form.clientId,
        invoiceNumber: form.invoiceNumber.trim() || undefined,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        amount: total,
        subtotal: amount,
        tax: taxAmount,
        discount: discountAmount,
        notes: form.notes,
      };
      const response = isEditing
        ? await invoiceService.updateInvoice(id, invoiceData)
        : await invoiceService.createInvoice(invoiceData);

      if (!response.success){

        throw new Error(
          response?.message ||
          (isEditing ? "Failed to update invoice" : "Failed to create invoice")
        );
      }


      setSuccess(
        isEditing ? "Invoice updated successfully!" : "Invoice created successfully!"
      );


      /*
        Redirect after successful creation
      */

      setTimeout(() => {

        navigate("/invoices");

      }, 1000);


    } catch (err) {

      console.error(
        "Create invoice error:",
        err
      );

      setError(
        err.message ||
        "Failed to create invoice."
      );

    } finally {

      setSaving(false);

    }
  };


  return (

    <div className="add-invoice-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <div className="add-invoice-header">

        <div>

          <Link
            to="/invoices"
            className="back-invoice"
          >
            <FiArrowLeft />
            Invoices
          </Link>

          <h1>
            {isEditing ? "Edit Invoice" : "Create Invoice"}
          </h1>

          <p>
            {isEditing ? "Update invoice details." : "Create a new invoice for your client."}
          </p>

        </div>

      </div>


      {/* =====================================
          ALERTS
      ===================================== */}

      {error && (

        <div className="invoice-alert error">
          {error}
        </div>

      )}

      {loadingInvoice && (
        <div className="invoice-alert">Loading invoice details...</div>
      )}

      {success && (

        <div className="invoice-alert success">
          {success}
        </div>

      )}


      <form
        className="add-invoice-layout"
        onSubmit={handleSubmit}
      >


        {/* ===================================
            LEFT SIDE
        =================================== */}

        <div className="invoice-form-main">


          {/* CLIENT */}

          <div className="invoice-form-card">

            <div className="form-card-heading">

              <div className="heading-icon">
                <FiUser />
              </div>

              <div>

                <h2>
                  Client Details
                </h2>

                <p>
                  Select the client for this invoice.
                </p>

              </div>

            </div>


            <div className="form-field">

              <label>
                Client
                <span>*</span>
              </label>

              <select
                name="clientId"
                value={form.clientId}
                onChange={handleChange}
                disabled={loadingClients}
              >

                <option value="">
                  {loadingClients
                    ? "Loading clients..."
                    : "Select a client"}
                </option>

                {clients.map(
                  (client) => (

                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                      {client.companyName
                        ? ` — ${client.companyName}`
                        : ""}
                    </option>

                  )
                )}

              </select>


              {!loadingClients &&
                clients.length === 0 && (

                  <Link
                    to="/add-client"
                    className="create-client-link"
                  >
                    <FiPlus />
                    Create a client first
                  </Link>

                )}

            </div>

          </div>


          {/* INVOICE INFORMATION */}

          <div className="invoice-form-card">

            <div className="form-card-heading">

              <div className="heading-icon">
                <FiFileText />
              </div>

              <div>

                <h2>
                  Invoice Information
                </h2>

                <p>
                  Basic invoice details.
                </p>

              </div>

            </div>


            <div className="form-grid">


              <div className="form-field">

                <label>
                  Invoice Number
                </label>

                <input
                  type="text"
                  name="invoiceNumber"
                  placeholder="e.g. INV-001"
                  value={
                    form.invoiceNumber
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              <div className="form-field">

                <label>
                  Issue Date
                </label>

                <div className="input-icon">

                  <FiCalendar />

                  <input
                    type="date"
                    name="issueDate"
                    value={
                      form.issueDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="form-field">

                <label>
                  Due Date
                  <span>*</span>
                </label>

                <div className="input-icon">

                  <FiCalendar />

                  <input
                    type="date"
                    name="dueDate"
                    value={
                      form.dueDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </div>

          </div>


          {/* AMOUNT */}

          <div className="invoice-form-card">

            <div className="form-card-heading">

              <div className="heading-icon">
                $
              </div>

              <div>

                <h2>
                  Amount
                </h2>

                <p>
                  Add invoice amount and adjustments.
                </p>

              </div>

            </div>


            <div className="form-grid three">


              <div className="form-field">

                <label>
                  Subtotal
                  <span>*</span>
                </label>

                <div className="currency-input">

                  <span>
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    step="0.01"
                    name="amount"
                    placeholder="0"
                    value={
                      form.amount
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="form-field">

                <label>
                  Tax (%)
                </label>

                <div className="percentage-input">

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="tax"
                    value={
                      form.tax
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    %
                  </span>

                </div>

              </div>


              <div className="form-field">

                <label>
                  Discount (%)
                </label>

                <div className="percentage-input">

                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="discount"
                    value={
                      form.discount
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    %
                  </span>

                </div>

              </div>

            </div>


            <div className="invoice-total-box">

              <span>
                Total Amount
              </span>

              <strong>
                ₹
                {total.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </strong>

            </div>

          </div>


          {/* NOTES */}

          <div className="invoice-form-card">

            <div className="form-card-heading">

              <div className="heading-icon">
                <FiFileText />
              </div>

              <div>

                <h2>
                  Notes
                </h2>

                <p>
                  Add any additional information.
                </p>

              </div>

            </div>


            <textarea
              name="notes"
              rows="5"
              placeholder="Add notes for the client..."
              value={
                form.notes
              }
              onChange={
                handleChange
              }
            />

          </div>

        </div>


        {/* ===================================
            RIGHT SIDE
        =================================== */}

        <div className="invoice-form-sidebar">


          {/* SUMMARY */}

          <div className="invoice-summary-card">

            <h2>
              Invoice Summary
            </h2>


            <div className="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ₹
                {amount.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Tax
              </span>

              <strong>
                ₹
                {taxAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>


            <div className="summary-row">

              <span>
                Discount
              </span>

              <strong>
                - ₹
                {discountAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>


            <div className="summary-divider" />


            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {total.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </strong>

            </div>

          </div>


          {/* REMINDER INFO */}

          <div className="invoice-reminder-card">

            <div className="reminder-dot"></div>

            <div>

              <h3>
                Automatic Reminders
              </h3>

              <p>
                LedgerSync can automatically
                remind your client before and
                after the due date.
              </p>

            </div>

          </div>


          {/* ACTIONS */}

          <div className="invoice-actions-card">

            <button
              type="submit"
              className="save-invoice-btn"
              disabled={saving || loadingInvoice || loadingClients}
            >

              <FiSave />

              {saving
                ? (isEditing ? "Saving..." : "Creating...")
                : (isEditing ? "Save Changes" : "Create Invoice")}

            </button>


            <button
              type="button"
              className="cancel-invoice-btn"
              onClick={() =>
                navigate("/invoices")
              }
            >
              Cancel
            </button>

          </div>

        </div>

      </form>

    </div>
  );
}

export default AddInvoice;