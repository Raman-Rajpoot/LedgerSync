import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiFileText,
  FiCheckCircle,
  FiPauseCircle,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import {
  Navigate,
  Link,
} from "react-router-dom";

import "../style/templates.css";
import templateService from "../../services/template.service";
function Templates() {

  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId");

  const [templates, setTemplates] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [channel, setChannel] =
    useState("All");

  const [stage, setStage] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);

  const [editingTemplate, setEditingTemplate] =
    useState(null);
const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: "",
    channel: "EMAIL",
    stage: "FIRST_REMINDER",
    subject: "",
    content: "",
    isActive: true,
  });


  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  /* =========================================
     FETCH TEMPLATES
  ========================================= */

  useEffect(() => {
    fetchTemplates();
  }, [organizationId]);


  const fetchTemplates = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await templateService.getAllTemplates({page});


      if (!response.success) {
        throw new Error(
          "Failed to load templates"
        );
      }




      const data =
        response.data || [];

     
      setTemplates(
        Array.isArray(data)
          ? data
          : []
      );
    setPage(page + 1);
    } catch (err) {

      console.error(err);

      setError(
        "Unable to load templates."
      );

    } finally {

      setLoading(false);

    }
  };


  /* =========================================
     FORM
  ========================================= */

  const openCreateModal = () => {

    setEditingTemplate(null);

    setForm({
      name: "",
      channel: "EMAIL",
      stage: "FIRST_REMINDER",
      subject: "",
      content: "",
      isActive: true,
    });

    setShowModal(true);
  };


  const openEditModal = (template) => {

    setEditingTemplate(template);

    setForm({
      name: template.name || "",
      channel:
        template.channel ||
        "EMAIL",
      stage:
        template.stage ||
        "FIRST_REMINDER",
      subject:
        template.subject ||
        "",
      content:
        template.content ||
        "",
      isActive:
        template.isActive !== false,
    });

    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };


  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };


  /* =========================================
     CREATE / UPDATE
  ========================================= */

  const saveTemplate = async (e) => {

    e.preventDefault();

    try {

      const isEditing =
        Boolean(editingTemplate);


const payload = {
  ...form,
  organizationId,
};

const response = isEditing
  ? await templateService.updateTemplate(
      editingTemplate.id,
      payload
    )
  : await templateService.createTemplate(
      payload
    );


      if (!response.success) {
        throw new Error(
          "Unable to save template"
        );
      }


      await fetchTemplates();

      closeModal();

    } catch (err) {

      console.error(err);

      alert(
        "Unable to save template."
      );

    }

  };


  /* =========================================
     DELETE
  ========================================= */

  const deleteTemplate =
    async (id) => {

      const confirmed =
        window.confirm(
          "Delete this template?"
        );

      if (!confirmed) {
        return;
      }


      try {

        const response =
          await templateService.deleteTemplate(
            id
          );


        if (!response.success) {
          throw new Error(
            "Unable to delete template"
          );
        }


        setTemplates(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !== id
            )
        );

      } catch (err) {

        console.error(err);

        alert(
          "Unable to delete template."
        );

      }

    };


  /* =========================================
     TOGGLE ACTIVE
  ========================================= */

  const toggleTemplate =
    async (template) => {

      try {

        const response =
          await templateService.updateTemplate(
            template.id,
            {
              isActive: !template.isActive,
            }
          );




        if (!response.success) {
          throw new Error(
            "Unable to update template"
          );
        }


        setTemplates(
          (prev) =>
            prev.map((item) =>
              item.id === template.id
                ? {
                    ...item,
                    isActive:
                      !template.isActive,
                  }
                : item
            )
        );

      } catch (err) {

        console.error(err);

        alert(
          "Unable to update template."
        );

      }

    };


  /* =========================================
     FILTER
  ========================================= */

  const filteredTemplates =
    templates.filter(
      (template) => {

        const matchesSearch =
          template.name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          template.content
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            );


        const matchesChannel =
          channel === "All" ||
          template.channel ===
            channel;


        const matchesStage =
          stage === "All" ||
          template.stage ===
            stage;


        return (
          matchesSearch &&
          matchesChannel &&
          matchesStage
        );

      }
    );


  /* =========================================
     HELPERS
  ========================================= */

  const stageLabel = (value) => {

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


  const ChannelIcon =
    ({ channel }) => {

      if (
        channel ===
        "WHATSAPP"
      ) {
        return (
          <FiMessageSquare />
        );
      }

      if (
        channel === "SMS"
      ) {
        return <FiPhone />;
      }

      return <FiMail />;

    };


  return (

    <div className="templates-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <div className="templates-header">

        <div>

          <h1>
            Templates
          </h1>

          <p>
            Create and manage messages used
            for automatic payment reminders.
          </p>

        </div>


        <button
          className="add-template-btn"
          onClick={
            openCreateModal
          }
        >

          <FiPlus />

          New Template

        </button>

      </div>


      {/* =====================================
          STATS
      ===================================== */}

      <div className="template-stats">

        <div className="template-stat">

          <div className="template-stat-icon purple">
            <FiFileText />
          </div>

          <div>

            <span>
              Total Templates
            </span>

            <strong>
              {templates.length}
            </strong>

          </div>

        </div>


        <div className="template-stat">

          <div className="template-stat-icon green">
            <FiCheckCircle />
          </div>

          <div>

            <span>
              Active
            </span>

            <strong>
              {
                templates.filter(
                  (item) =>
                    item.isActive
                ).length
              }
            </strong>

          </div>

        </div>


        <div className="template-stat">

          <div className="template-stat-icon blue">
            <FiMail />
          </div>

          <div>

            <span>
              Email
            </span>

            <strong>
              {
                templates.filter(
                  (item) =>
                    item.channel ===
                    "EMAIL"
                ).length
              }
            </strong>

          </div>

        </div>


        <div className="template-stat">

          <div className="template-stat-icon orange">
            <FiMessageSquare />
          </div>

          <div>

            <span>
              WhatsApp / SMS
            </span>

            <strong>
              {
                templates.filter(
                  (item) =>
                    item.channel ===
                      "WHATSAPP" ||
                    item.channel ===
                      "SMS"
                ).length
              }
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================
          FILTERS
      ===================================== */}

      <div className="templates-toolbar">

        <div className="template-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


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
          CONTENT
      ===================================== */}

      <div className="templates-card">

        <div className="templates-card-header">

          <div>

            <h2>
              Message Templates
            </h2>

            <p>
              {filteredTemplates.length}
              {" "}
              template(s)
            </p>

          </div>

          <button
            className="template-refresh"
            onClick={
              fetchTemplates
            }
          >
            <FiRefreshCw />
          </button>

        </div>


        {loading ? (

          <div className="template-state">

            <div className="template-spinner"></div>

            <h3>
              Loading templates...
            </h3>

          </div>

        ) : error ? (

          <div className="template-state">

            <FiFileText />

            <h3>
              {error}
            </h3>

            <button
              onClick={
                fetchTemplates
              }
            >
              Try Again
            </button>

          </div>

        ) : filteredTemplates.length === 0 ? (

          <div className="template-state">

            <FiFileText />

            <h3>
              No Templates Found
            </h3>

            <p>
              Create your first reminder
              template.
            </p>

            <button
              onClick={
                openCreateModal
              }
            >
              <FiPlus />
              Create Template
            </button>

          </div>

        ) : (

          <div className="template-list">

            {filteredTemplates.map(
              (template) => (

                <div
                  className="template-item"
                  key={
                    template.id
                  }
                >

                  {/* ICON */}

                  <div className="template-channel-icon">

                    <ChannelIcon
                      channel={
                        template.channel
                      }
                    />

                  </div>


                  {/* MAIN */}

                  <div className="template-main">

                    <div className="template-title-row">

                      <h3>
                        {template.name}
                      </h3>

                      <span
                        className={`template-active ${
                          template.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >

                        {template.isActive
                          ? "Active"
                          : "Inactive"}

                      </span>

                    </div>


                    <div className="template-meta">

                      <span>
                        {stageLabel(
                          template.stage
                        )}
                      </span>

                      <span>
                        •
                      </span>

                      <span>
                        {template.channel}
                      </span>

                    </div>


                    {template.subject && (

                      <div className="template-subject">

                        <strong>
                          Subject:
                        </strong>

                        {template.subject}

                      </div>

                    )}


                    <p className="template-preview">

                      {template.content}

                    </p>


                    <div className="template-variables">

                      <span>
                        Supported variables:
                      </span>

                      <code>
                        {"{{clientName}}"}
                      </code>

                      <code>
                        {"{{invoiceNumber}}"}
                      </code>

                      <code>
                        {"{{amount}}"}
                      </code>

                      <code>
                        {"{{dueDate}}"}
                      </code>

                    </div>

                  </div>


                  {/* ACTIONS */}

                  <div className="template-actions">

                    <button
                      title={
                        template.isActive
                          ? "Deactivate"
                          : "Activate"
                      }
                      onClick={() =>
                        toggleTemplate(
                          template
                        )
                      }
                    >

                      {template.isActive
                        ? <FiPauseCircle />
                        : <FiCheckCircle />}

                    </button>


                    <button
                      title="Edit"
                      onClick={() =>
                        openEditModal(
                          template
                        )
                      }
                    >

                      <FiEdit2 />

                    </button>


                    <button
                      title="Delete"
                      className="delete"
                      onClick={() =>
                        deleteTemplate(
                          template.id
                        )
                      }
                    >

                      <FiTrash2 />

                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* =====================================
          TEMPLATE FLOW
      ===================================== */}

      <div className="template-flow-card">

        <div className="template-flow-heading">

          <FiFileText />

          <div>

            <h2>
              How Templates Work
            </h2>

            <p>
              One template is selected based
              on the invoice reminder stage.
            </p>

          </div>

        </div>


        <div className="template-flow">

          <div className="template-flow-box">
            Invoice
          </div>

          <span>→</span>

          <div className="template-flow-box">
            Reminder Stage
          </div>

          <span>→</span>

          <div className="template-flow-box">
            Template
          </div>

          <span>→</span>

          <div className="template-flow-box">
            Replace Variables
          </div>

          <span>→</span>

          <div className="template-flow-box">
            Send
          </div>

        </div>

      </div>


      {/* =====================================
          MODAL
      ===================================== */}

      {showModal && (

        <div
          className="template-modal-overlay"
          onClick={
            closeModal
          }
        >

          <div
            className="template-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="template-modal-header">

              <div>

                <h2>
                  {editingTemplate
                    ? "Edit Template"
                    : "Create Template"}
                </h2>

                <p>
                  Configure the message
                  LedgerSync will send.
                </p>

              </div>

              <button
                onClick={
                  closeModal
                }
              >
                <FiX />
              </button>

            </div>


            <form
              onSubmit={
                saveTemplate
              }
            >


              {/* NAME */}

              <div className="template-form-group">

                <label>
                  Template Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="e.g. First Payment Reminder"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              <div className="template-form-row">


                {/* CHANNEL */}

                <div className="template-form-group">

                  <label>
                    Channel
                  </label>

                  <select
                    name="channel"
                    value={
                      form.channel
                    }
                    onChange={
                      handleChange
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

                  </select>

                </div>


                {/* STAGE */}

                <div className="template-form-group">

                  <label>
                    Reminder Stage
                  </label>

                  <select
                    name="stage"
                    value={
                      form.stage
                    }
                    onChange={
                      handleChange
                    }
                  >

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

              </div>


              {/* SUBJECT */}

              {form.channel ===
                "EMAIL" && (

                <div className="template-form-group">

                  <label>
                    Subject
                  </label>

                  <input
                    type="text"
                    name="subject"
                    placeholder="Payment reminder for {{invoiceNumber}}"
                    value={
                      form.subject
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              )}


              {/* CONTENT */}

              <div className="template-form-group">

                <label>
                  Message
                </label>

                <textarea
                  name="content"
                  rows="8"
                  placeholder={`Hi {{clientName}},

This is a reminder that invoice {{invoiceNumber}} for {{amount}} is due on {{dueDate}}.

Please make the payment at your earliest convenience.

Thank you.`}
                  value={
                    form.content
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              {/* VARIABLES */}

              <div className="available-variables">

                <span>
                  Available variables
                </span>

                <code>
                  {"{{clientName}}"}
                </code>

                <code>
                  {"{{invoiceNumber}}"}
                </code>

                <code>
                  {"{{amount}}"}
                </code>

                <code>
                  {"{{dueDate}}"}
                </code>

              </div>


              {/* ACTIVE */}

              <label className="template-active-toggle">

                <input
                  type="checkbox"
                  name="isActive"
                  checked={
                    form.isActive
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  Make this template active
                </span>

              </label>


              {/* BUTTONS */}

              <div className="template-modal-actions">

                <button
                  type="button"
                  className="cancel-template-btn"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-template-btn"
                >

                  {editingTemplate
                    ? "Update Template"
                    : "Create Template"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}

export default Templates;