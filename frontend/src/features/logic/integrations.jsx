import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiSave,
} from "react-icons/fi";

import "../style/integrations.css";
import integrationService from "../../services/integration.service";

function Integrations() {
  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [integrations, setIntegrations] = useState({
    email: {
      id: null,
      connected: false,
      host: "",
      port: "587",
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
    },

    twilio: {
      id: null,
      connected: false,
      accountSid: "",
      authToken: "",
      phoneNumber: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [testing, setTesting] = useState("");

  /*
   * Fetch integrations when component loads
   */
  useEffect(() => {
    if (token) {
      fetchIntegrations();
    }
  }, [token]);

  /*
   * Get all integrations
   */
  const fetchIntegrations = async () => {
    try {
      setLoading(true);

      const response =
        await integrationService.getAllIntegrations();

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to fetch integrations"
        );
      }

      if (response.data) {
        setIntegrations((prev) => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (error) {
      console.error(
        "Integration fetch error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Update form fields
   */
  const updateIntegration = (
    type,
    field,
    value
  ) => {
    setIntegrations((prev) => ({
      ...prev,

      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  /*
   * Save integration
   */
  const saveIntegration = async (type) => {
  try {
    setSaving(type);

    let response;

    if (type === "email") {
      const integrationData = {
        provider: "EMAIL",

        config: {
          host: integrations.email.host,
          port: Number(integrations.email.port),
          username: integrations.email.username,
          password: integrations.email.password,
          fromEmail: integrations.email.fromEmail,
          fromName: integrations.email.fromName,
        },
      };

      console.log("Email integration:", integrationData);

      response =
        await integrationService.saveEmailIntegration(
          integrationData
        );
    }

    else if (type === "twilio") {
      const integrationData = {
        provider: "TWILIO",

        config: {
          accountSid:
            integrations.twilio.accountSid,
          authToken:
            integrations.twilio.authToken,
          phoneNumber:
            integrations.twilio.phoneNumber,
        },
      };

      console.log("Twilio integration:", integrationData);

      response =
        await integrationService.saveTwilioIntegration(
          integrationData
        );
    }

    console.log("res:", response);

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Failed to save integration"
      );
    }

    alert(
      `${type.toUpperCase()} integration saved successfully`
    );

    await fetchIntegrations();

  } catch (error) {
    console.error(
      "Integration Failed!! Try again:",
      error
    );

    alert(
      error.message ||
        `Failed to save ${type} integration`
    );
  } finally {
    setSaving("");
  }
};

  /*
   * Test integration
   */
  const testIntegration = async (type) => {
    try {
      setTesting(type);

      const response =
        await integrationService.testIntegration({
          type,
          organizationId,
          ...integrations[type],
        });

      if (!response.success) {
        throw new Error(
          response.message ||
            "Connection test failed"
        );
      }

      alert(
        response.message ||
          "Connection successful"
      );
    } catch (error) {
      console.error(
        "Integration test error:",
        error
      );

      alert(
        error.message ||
          "Connection test failed"
      );
    } finally {
      setTesting("");
    }
  };

  /*
   * Disconnect integration
   *
   * IMPORTANT:
   * integrationService.deleteIntegration()
   * expects an ID, not an object.
   */
  const disconnectIntegration = async (
    type
  ) => {
    const integration =
      integrations[type];

    if (!integration?.id) {
      alert(
        "Integration ID not found"
      );
      return;
    }

    const confirmDisconnect =
      window.confirm(
        `Disconnect ${type} integration?`
      );

    if (!confirmDisconnect) {
      return;
    }

    try {
      setSaving(type);

      const response =
        await integrationService.deleteIntegration(
          type
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to disconnect"
        );
      }

      await fetchIntegrations();

      alert(
        `${type.toUpperCase()} disconnected`
      );
    } catch (error) {
      console.error(
        "Disconnect integration error:",
        error
      );

      alert(
        error.message ||
          "Failed to disconnect integration"
      );
    } finally {
      setSaving("");
    }
  };

  /*
   * Authentication check
   */
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="integration-loading">
        <FiRefreshCw />
        Loading integrations...
      </div>
    );
  }

  return (
    <div className="integrations-page">

      {/* ================= HEADER ================= */}

      <div className="integrations-header">
        <div>
          <h1>Integrations</h1>

          <p>
            Connect the services LedgerSync
            uses to communicate with your
            clients.
          </p>
        </div>

        <button
          className="refresh-integrations"
          onClick={fetchIntegrations}
          disabled={loading}
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {/* ================= EMAIL ================= */}

      <div className="integration-card">

        <div className="integration-card-header">

          <div className="integration-title">

            <div className="integration-icon email">
              <FiMail />
            </div>

            <div>
              <h2>Email / SMTP</h2>

              <p>
                Send invoice reminders
                through email.
              </p>
            </div>

          </div>

          <div
            className={
              integrations.email.connected
                ? "integration-status connected"
                : "integration-status disconnected"
            }
          >
            {integrations.email.connected ? (
              <>
                <FiCheckCircle />
                Connected
              </>
            ) : (
              <>
                <FiXCircle />
                Not Connected
              </>
            )}
          </div>

        </div>

        <div className="integration-form">

          {/* SMTP HOST */}

          <div className="integration-field">
            <label>SMTP Host</label>

            <input
              value={
                integrations.email.host
              }
              onChange={(e) =>
                updateIntegration(
                  "email",
                  "host",
                  e.target.value
                )
              }
              placeholder="smtp.gmail.com"
            />
          </div>

          {/* SMTP PORT */}

          <div className="integration-field">
            <label>SMTP Port</label>

            <input
              value={
                integrations.email.port
              }
              onChange={(e) =>
                updateIntegration(
                  "email",
                  "port",
                  e.target.value
                )
              }
              placeholder="587"
            />
          </div>

          {/* USERNAME */}

          <div className="integration-field">
            <label>
              Username / Email
            </label>

            <input
              value={
                integrations.email.username
              }
              onChange={(e) =>
                updateIntegration(
                  "email",
                  "username",
                  e.target.value
                )
              }
              placeholder="your@email.com"
            />
          </div>

          {/* PASSWORD */}

          <div className="integration-field">
            <label>
              Password / App Password
            </label>

            <input
              type="password"
              value={
                integrations.email.password
              }
              onChange={(e) =>
                updateIntegration(
                  "email",
                  "password",
                  e.target.value
                )
              }
              placeholder="App password"
            />
          </div>

          {/* FROM EMAIL */}

          <div className="integration-field">
            <label>From Email</label>

            <input
              value={
                integrations.email.fromEmail
              }
              onChange={(e) =>
                updateIntegration(
                  "email",
                  "fromEmail",
                  e.target.value
                )
              }
              placeholder="billing@company.com"
            />
          </div>

          {/* FROM NAME */}

          <div className="integration-field">
            <label>From Name</label>

            <input
              value={
                integrations.email.fromName
              }
              onChange={(e) =>
                updateIntegration(
                  "email",
                  "fromName",
                  e.target.value
                )
              }
              placeholder="LedgerSync"
            />
          </div>

        </div>

        {/* EMAIL ACTIONS */}

        <div className="integration-actions">

          {integrations.email.connected && (
            <button
              className="disconnect-btn"
              onClick={() =>
                disconnectIntegration(
                  "email"
                )
              }
              disabled={
                saving === "email"
              }
            >
              Disconnect
            </button>
          )}

          <button
            className="test-btn"
            onClick={() =>
              testIntegration("email")
            }
            disabled={
              testing === "email"
            }
          >
            <FiCheckCircle />

            {testing === "email"
              ? "Testing..."
              : "Test Connection"}
          </button>

          <button
            className="save-integration-btn"
            onClick={() =>
              saveIntegration("email")
            }
            disabled={
              saving === "email"
            }
          >
            <FiSave />

            {saving === "email"
              ? "Saving..."
              : "Save"}
          </button>

        </div>

      </div>

      {/* ================= TWILIO ================= */}

      <div className="integration-card">

        <div className="integration-card-header">

          <div className="integration-title">

            <div className="integration-icon twilio">
              <FiMessageSquare />
            </div>

            <div>
              <h2>Twilio</h2>

              <p>
                Send SMS and WhatsApp
                reminders.
              </p>
            </div>

          </div>

          <div
            className={
              integrations.twilio.connected
                ? "integration-status connected"
                : "integration-status disconnected"
            }
          >
            {integrations.twilio.connected ? (
              <>
                <FiCheckCircle />
                Connected
              </>
            ) : (
              <>
                <FiXCircle />
                Not Connected
              </>
            )}
          </div>

        </div>

        <div className="integration-form">

          {/* ACCOUNT SID */}

          <div className="integration-field full">
            <label>Account SID</label>

            <input
              value={
                integrations.twilio
                  .accountSid
              }
              onChange={(e) =>
                updateIntegration(
                  "twilio",
                  "accountSid",
                  e.target.value
                )
              }
              placeholder="ACxxxxxxxxxxxxxxxx"
            />
          </div>

          {/* AUTH TOKEN */}

          <div className="integration-field full">
            <label>Auth Token</label>

            <input
              type="password"
              value={
                integrations.twilio
                  .authToken
              }
              onChange={(e) =>
                updateIntegration(
                  "twilio",
                  "authToken",
                  e.target.value
                )
              }
              placeholder="Twilio auth token"
            />
          </div>

          {/* PHONE NUMBER */}

          <div className="integration-field">
            <label>
              Twilio Phone Number
            </label>

            <input
              value={
                integrations.twilio
                  .phoneNumber
              }
              onChange={(e) =>
                updateIntegration(
                  "twilio",
                  "phoneNumber",
                  e.target.value
                )
              }
              placeholder="+1234567890"
            />
          </div>

        </div>

        {/* TWILIO ACTIONS */}

        <div className="integration-actions">

          {integrations.twilio.connected && (
            <button
              className="disconnect-btn"
              onClick={() =>
                disconnectIntegration(
                  "twilio"
                )
              }
              disabled={
                saving === "twilio"
              }
            >
              Disconnect
            </button>
          )}

          <button
            className="test-btn"
            onClick={() =>
              testIntegration("twilio")
            }
            disabled={
              testing === "twilio"
            }
          >
            <FiCheckCircle />

            {testing === "twilio"
              ? "Testing..."
              : "Test Connection"}
          </button>

          <button
            className="save-integration-btn"
            onClick={() =>
              saveIntegration("twilio")
            }
            disabled={
              saving === "twilio"
            }
          >
            <FiSave />

            {saving === "twilio"
              ? "Saving..."
              : "Save"}
          </button>

        </div>

      </div>

      {/* ================= FLOW ================= */}

      <div className="integration-info">

        <div className="integration-info-icon">
          <FiPhone />
        </div>

        <div>
          <strong>
            How integrations work
          </strong>

          <p>
            LedgerSync uses these connected
            services when the reminder
            scheduler sends an email, SMS
            or WhatsApp message to a client.
          </p>
        </div>

      </div>

    </div>
  );
}

export default Integrations;
