import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  FiUser,
  FiBriefcase,
  FiFileText,
  FiBell,
  FiLock,
  FiSave,
  FiLogOut,
} from "react-icons/fi";

import "../style/settings.css";

function Settings() {
  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm] = useState({
    name: "",
    email: "",
    organizationName: "",
    phone: "",
    gstin: "",
    address: "",
    invoicePrefix: "INV",
    paymentTerms: "30",
    currency: "INR",
    remindersEnabled: true,
    autoEscalation: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/v1/api/settings?organizationId=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load settings");
      }

      const result = await response.json();

      const data = result.data || result;

      setForm((prev) => ({
        ...prev,
        ...data,
      }));
    } catch (error) {
      console.error("Settings fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch(
        `/v1/api/settings?organizationId=${organizationId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      alert("Settings saved successfully.");
    } catch (error) {
      console.error(error);

      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("organizationId");
    localStorage.removeItem("organisationId");

    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="settings-loading">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="settings-page">

      {/* HEADER */}

      <div className="settings-header">
        <div>
          <h1>Settings</h1>

          <p>
            Manage your account and LedgerSync preferences.
          </p>
        </div>

        <button
          className="settings-save-btn"
          onClick={saveSettings}
          disabled={saving}
        >
          <FiSave />

          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>


      {/* SETTINGS BODY */}

      <div className="settings-layout">

        {/* SIDEBAR */}

        <div className="settings-tabs">

          <button
            className={
              activeTab === "profile"
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => setActiveTab("profile")}
          >
            <FiUser />

            Profile
          </button>


          <button
            className={
              activeTab === "organization"
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => setActiveTab("organization")}
          >
            <FiBriefcase />

            Organization
          </button>


          <button
            className={
              activeTab === "invoice"
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => setActiveTab("invoice")}
          >
            <FiFileText />

            Invoice Settings
          </button>


          <button
            className={
              activeTab === "reminders"
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => setActiveTab("reminders")}
          >
            <FiBell />

            Reminders
          </button>


          <button
            className={
              activeTab === "security"
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() => setActiveTab("security")}
          >
            <FiLock />

            Security
          </button>

        </div>


        {/* CONTENT */}

        <div className="settings-content">

          {/* PROFILE */}

          {activeTab === "profile" && (
            <div className="settings-section">

              <h2>Profile</h2>

              <p className="section-description">
                Update your personal information.
              </p>


              <div className="settings-avatar">

                <div className="settings-avatar-circle">
                  {form.name
                    ? form.name.charAt(0).toUpperCase()
                    : "R"}
                </div>

                <div>
                  <strong>
                    {form.name || "User"}
                  </strong>

                  <p>
                    Account owner
                  </p>
                </div>

              </div>


              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>Name</label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                  />

                </div>


                <div className="settings-field">

                  <label>Email</label>

                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                  />

                </div>

              </div>

            </div>
          )}


          {/* ORGANIZATION */}

          {activeTab === "organization" && (
            <div className="settings-section">

              <h2>Organization</h2>

              <p className="section-description">
                Manage your business information.
              </p>


              <div className="settings-form-grid">

                <div className="settings-field full">

                  <label>Organization Name</label>

                  <input
                    name="organizationName"
                    value={form.organizationName}
                    onChange={handleChange}
                    placeholder="Your company name"
                  />

                </div>


                <div className="settings-field">

                  <label>Phone</label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                  />

                </div>


                <div className="settings-field">

                  <label>GSTIN</label>

                  <input
                    name="gstin"
                    value={form.gstin}
                    onChange={handleChange}
                    placeholder="GST Number"
                  />

                </div>


                <div className="settings-field full">

                  <label>Address</label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Business address"
                  />

                </div>

              </div>

            </div>
          )}


          {/* INVOICE */}

          {activeTab === "invoice" && (
            <div className="settings-section">

              <h2>Invoice Settings</h2>

              <p className="section-description">
                Configure how your invoices are generated.
              </p>


              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>Invoice Prefix</label>

                  <input
                    name="invoicePrefix"
                    value={form.invoicePrefix}
                    onChange={handleChange}
                  />

                </div>


                <div className="settings-field">

                  <label>Currency</label>

                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                  >
                    <option value="INR">
                      INR - Indian Rupee
                    </option>

                    <option value="USD">
                      USD - US Dollar
                    </option>

                    <option value="EUR">
                      EUR - Euro
                    </option>
                  </select>

                </div>


                <div className="settings-field">

                  <label>Default Payment Terms</label>

                  <select
                    name="paymentTerms"
                    value={form.paymentTerms}
                    onChange={handleChange}
                  >
                    <option value="7">
                      7 Days
                    </option>

                    <option value="15">
                      15 Days
                    </option>

                    <option value="30">
                      30 Days
                    </option>

                    <option value="45">
                      45 Days
                    </option>

                    <option value="60">
                      60 Days
                    </option>
                  </select>

                </div>

              </div>

            </div>
          )}


          {/* REMINDERS */}

          {activeTab === "reminders" && (
            <div className="settings-section">

              <h2>Reminder Settings</h2>

              <p className="section-description">
                Configure automatic invoice reminders.
              </p>


              <div className="setting-toggle">

                <div>
                  <strong>
                    Automatic Reminders
                  </strong>

                  <p>
                    Automatically remind clients about unpaid invoices.
                  </p>
                </div>

                <label className="switch">

                  <input
                    type="checkbox"
                    name="remindersEnabled"
                    checked={form.remindersEnabled}
                    onChange={handleChange}
                  />

                  <span></span>

                </label>

              </div>


              <div className="setting-toggle">

                <div>
                  <strong>
                    Automatic Escalation
                  </strong>

                  <p>
                    Escalate overdue invoices when reminders are ignored.
                  </p>
                </div>

                <label className="switch">

                  <input
                    type="checkbox"
                    name="autoEscalation"
                    checked={form.autoEscalation}
                    onChange={handleChange}
                  />

                  <span></span>

                </label>

              </div>

            </div>
          )}


          {/* SECURITY */}

          {activeTab === "security" && (
            <div className="settings-section">

              <h2>Security</h2>

              <p className="section-description">
                Manage your account security.
              </p>


              <div className="security-card">

                <div>

                  <strong>
                    Password
                  </strong>

                  <p>
                    Change your account password.
                  </p>

                </div>

                <button>
                  Change Password
                </button>

              </div>


              <div className="danger-zone">

                <div>

                  <strong>
                    Logout
                  </strong>

                  <p>
                    Sign out from this device.
                  </p>

                </div>

                <button
                  onClick={logout}
                >
                  <FiLogOut />

                  Logout
                </button>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Settings;