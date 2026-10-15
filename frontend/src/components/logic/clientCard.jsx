
import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import { Navigate } from "react-router-dom";
import "../style/clientCard.css";
import invoiceService from "../../services/invoice.service.js";

const ClientCard = ({
  clientId,
  name,
  company,
  mail,
  status,
}) => {
  const token = localStorage.getItem("token");

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInvoices, setShowInvoices] = useState(true);

  // Fetch invoices for this client
  const fetchInvoices = useCallback(async () => {
    if (!clientId) {
      setInvoices([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("Fetching invoices for client:", clientId);

      const response = await invoiceService.getClientInvoices({
        clientId,
        page: 1,
      });

      console.log("Invoice API response:", response.data);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to fetch invoices"
        );
      }

      const invoiceData = Array.isArray(response.data.data)
        ? response.data.data
        : [];

      setInvoices(invoiceData);
    } catch (err) {
      console.error(
        "Invoice fetch error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load invoices."
      );

      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Run when the client changes or invoices become visible
  useEffect(() => {
    console.log("ClientCard useEffect executed:", {
      clientId,
      showInvoices,
    });

    if (showInvoices && clientId) {
      fetchInvoices();
    }
  }, [clientId, showInvoices, fetchInvoices]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="client-card">
      <div>dasfsdinf feufnerrn neru eru sdfsdkf skf sdvmksd vsdkv svsdvsd sdv vsdm sfeskf sfsd smkfsdfskdfsdf </div>

      <div className="client-avatar">
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>

      <div className="client-info">
        <h3 className="client-name">
          {name || "Unnamed client"}
        </h3>

        <p className="client-mail">
          {mail || "No email provided"}
        </p>

        <p className="client-company">
          {company || "No company provided"}
        </p>
      </div>

      <div
        className={`client-status ${
          status === "ACTIVE"
            ? "status-active"
            : "status-overdue"
        }`}
      >
        {status || "UNKNOWN"}
      </div>

      <button
        type="button"
        className="client-invoices-btn"
        onClick={() =>
          setShowInvoices((prev) => !prev)
        }
        disabled={!clientId}
      >
        {showInvoices ? "Hide invoices" : "View invoices"}
      </button>

      {showInvoices && (
        <div className="client-invoices">
          <h4>Client invoices</h4>

          {loading && <p>Loading invoices...</p>}

          {!loading && error && (
            <p className="error-message">{error}</p>
          )}

          {!loading &&
            !error &&
            invoices.length === 0 && (
              <p>No invoices found for this client.</p>
            )}

          {!loading &&
            !error &&
            invoices.map((invoice) => (
              <div
                className="invoice-item"
                key={invoice.id}
              >
                <p>
                  <strong>Invoice:</strong>{" "}
                  {invoice.invoiceNumber || "N/A"}
                </p>

                <p>
                  <strong>Amount:</strong>{" "}
                  {invoice.amount ?? "N/A"}
                </p>

                <p>
                  <strong>Due date:</strong>{" "}
                  {invoice.dueDate
                    ? new Date(
                        invoice.dueDate
                      ).toLocaleDateString()
                    : "N/A"}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {invoice.status || "N/A"}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ClientCard;
