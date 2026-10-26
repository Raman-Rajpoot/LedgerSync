import React, { useCallback, useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiEye,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiX,
} from "react-icons/fi";
import { Navigate } from "react-router-dom";

import "../style/escalation.css";
import escalationService from "../../services/escalation.service";
import templateService from "../../services/template.service";

const STAGES = [
  "BEFORE_DUE",
  "DUE_TODAY",
  "FIRST_REMINDER",
  "SECOND_REMINDER",
  "THIRD_REMINDER",
  "FINAL_NOTICE",
  "LEGAL_NOTICE",
];
const CHANNELS = ["EMAIL", "SMS", "WHATSAPP"];
const EMPTY_FORM = {
  name: "",
  description: "",
  stage: "FIRST_REMINDER",
  daysOffset: "0",
  channel: "EMAIL",
  templateId: "",
};

function requireSuccess(response, fallback) {
  if (!response?.success) {
    throw new Error(response?.message || fallback);
  }
  return response;
}

function Escalation() {
  const token = localStorage.getItem("token");
  const [activeTab, setActiveTab] = useState("rules");
  const [rules, setRules] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [rulesLoading, setRulesLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    setRulesLoading(true);
    setError("");
    try {
      const [ruleResponse, statsResponse] = await Promise.all([
        escalationService.getRules(),
        escalationService.getRuleStatistics(),
      ]);
      requireSuccess(ruleResponse, "Failed to load escalation rules.");
      requireSuccess(statsResponse, "Failed to load escalation statistics.");
      setRules(Array.isArray(ruleResponse.data) ? ruleResponse.data : []);
      setStatistics(statsResponse.data || null);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load escalation rules."
      );
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const firstPage = requireSuccess(
        await templateService.getAllTemplates({ page: 1 }),
        "Failed to load templates."
      );
      const pages = Array.from(
        { length: Math.max((firstPage.totalPages || 1) - 1, 0) },
        (_, index) => index + 2
      );
      const remainingPages = await Promise.all(
        pages.map((templatePage) =>
          templateService.getAllTemplates({ page: templatePage })
        )
      );
      const allPages = [firstPage, ...remainingPages].map((response) =>
        requireSuccess(response, "Failed to load templates.")
      );
      setTemplates(allPages.flatMap((response) => response.data || []));
    } catch (requestError) {
      console.error(requestError);
      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load templates."
      );
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setError("");
    try {
      const response = requireSuccess(
        await escalationService.getHistory({
          page,
          limit: 20,
          ...(channelFilter && { channel: channelFilter }),
          ...(statusFilter && { status: statusFilter }),
        }),
        "Failed to load escalation history."
      );
      setHistory(Array.isArray(response.data) ? response.data : []);
      setPagination(response.pagination || null);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load escalation history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [channelFilter, page, statusFilter]);

  useEffect(() => {
    fetchRules();
    fetchTemplates();
  }, [fetchRules, fetchTemplates]);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchHistory]);

  if (!token) return <Navigate to="/login" replace />;

  const openCreateForm = () => {
    setEditingRule(null);
    setForm({
      ...EMPTY_FORM,
      templateId: templates[0]?.id || "",
    });
    setActionError("");
    setShowForm(true);
  };

  const openEditForm = (rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name || "",
      description: rule.description || "",
      stage: rule.stage,
      daysOffset: String(rule.daysOffset),
      channel: rule.channel,
      templateId: rule.templateId || rule.template?.id || "",
    });
    setActionError("");
    setShowForm(true);
  };

  const saveRule = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      const payload = {
        ...form,
        daysOffset: Number(form.daysOffset),
      };
      const response = editingRule
        ? await escalationService.updateRule(editingRule.id, payload)
        : await escalationService.createRule(payload);
      requireSuccess(response, "Unable to save escalation rule.");
      setShowForm(false);
      setEditingRule(null);
      await fetchRules();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to save escalation rule."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule) => {
    setActionError("");
    try {
      requireSuccess(
        await escalationService.toggleRule(rule.id),
        "Unable to update escalation rule."
      );
      await fetchRules();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to update escalation rule."
      );
    }
  };

  const deleteRule = async (rule) => {
    if (!window.confirm(`Delete the "${rule.name}" escalation rule?`)) return;
    setActionError("");
    try {
      requireSuccess(
        await escalationService.deleteRule(rule.id),
        "Unable to delete escalation rule."
      );
      await fetchRules();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to delete escalation rule."
      );
    }
  };

  const showHistoryDetails = async (entry) => {
    setSelectedHistory(entry);
    setDetailLoading(true);
    setActionError("");
    try {
      const response = requireSuccess(
        await escalationService.getHistoryEntry(entry.id),
        "Unable to load escalation history entry."
      );
      setSelectedHistory(response.data);
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load escalation history entry."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredRules = rules.filter((rule) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      rule.name?.toLowerCase().includes(query) ||
      rule.template?.name?.toLowerCase().includes(query) ||
      rule.stage?.toLowerCase().includes(query)
    );
  });

  const filteredHistory = history.filter((entry) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      entry.invoice?.client?.name?.toLowerCase().includes(query) ||
      entry.invoice?.invoiceNumber?.toLowerCase().includes(query) ||
      entry.invoiceId?.toLowerCase().includes(query)
    );
  });

  const setHistoryFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="escalation-page">
      <div className="escalation-header">
        <div>
          <h1>Escalations</h1>
          <p>Manage escalation rules and review invoice follow-up history.</p>
        </div>
        {activeTab === "rules" && (
          <button
            className="escalation-primary-btn"
            onClick={openCreateForm}
            disabled={templates.length === 0}
            title={
              templates.length === 0
                ? "Create a template before adding an escalation rule."
                : undefined
            }
          >
            <FiPlus /> New Rule
          </button>
        )}
      </div>

      <div className="escalation-tabs" role="tablist">
        <button
          className={activeTab === "rules" ? "active" : ""}
          onClick={() => {
            setActiveTab("rules");
            setError("");
          }}
          role="tab"
          aria-selected={activeTab === "rules"}
        >
          Rules
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => {
            setActiveTab("history");
            setError("");
          }}
          role="tab"
          aria-selected={activeTab === "history"}
        >
          History
        </button>
      </div>

      {activeTab === "rules" && (
        <div className="escalation-summary">
          <div className="escalation-stat">
            <FiAlertTriangle />
            <div>
              <span>Total rules</span>
              <strong>{statistics?.totalRules ?? rules.length}</strong>
            </div>
          </div>
          <div className="escalation-stat">
            <FiCheckCircle />
            <div>
              <span>Active</span>
              <strong>{statistics?.activeRules ?? 0}</strong>
            </div>
          </div>
          <div className="escalation-stat">
            <FiClock />
            <div>
              <span>Inactive</span>
              <strong>{statistics?.inactiveRules ?? 0}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="escalation-toolbar">
        <input
          className="escalation-search"
          placeholder={
            activeTab === "rules"
              ? "Search rules or templates..."
              : "Search client or invoice on this page..."
          }
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {activeTab === "history" && (
          <>
            <select
              aria-label="Filter history by channel"
              value={channelFilter}
              onChange={setHistoryFilter(setChannelFilter)}
            >
              <option value="">All channels</option>
              {CHANNELS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter history by status"
              value={statusFilter}
              onChange={setHistoryFilter(setStatusFilter)}
            >
              <option value="">All statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
            </select>
          </>
        )}
        <button
          className="escalation-refresh"
          onClick={activeTab === "rules" ? fetchRules : fetchHistory}
          aria-label="Refresh"
        >
          <FiRefreshCw />
        </button>
      </div>

      {(error || actionError) && (
        <div className="escalation-error" role="alert">
          <span>{error || actionError}</span>
          <button
            onClick={() => {
              setError("");
              setActionError("");
              if (activeTab === "rules") fetchRules();
              else fetchHistory();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {activeTab === "rules" ? (
        <section className="escalation-table" aria-label="Escalation rules">
          <div className="escalation-table-head rule-grid">
            <span>RULE</span>
            <span>STAGE / OFFSET</span>
            <span>CHANNEL / TEMPLATE</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>
          {rulesLoading ? (
            <div className="escalation-state">Loading escalation rules...</div>
          ) : filteredRules.length === 0 ? (
            <div className="escalation-state">
              <h3>No escalation rules found</h3>
              <p>Create a rule to schedule invoice follow-ups.</p>
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div className="escalation-row rule-grid" key={rule.id}>
                <div className="escalation-rule-name">
                  <strong>{rule.name}</strong>
                  <span>{rule.description || "No description"}</span>
                </div>
                <div>
                  <strong>{rule.stage}</strong>
                  <span>
                    {rule.daysOffset > 0
                      ? `${rule.daysOffset} day(s) after due`
                      : rule.daysOffset < 0
                        ? `${Math.abs(rule.daysOffset)} day(s) before due`
                        : "On due date"}
                  </span>
                </div>
                <div>
                  <strong>{rule.channel}</strong>
                  <span>{rule.template?.name || "Template unavailable"}</span>
                </div>
                <span
                  className={`escalation-status ${rule.isActive ? "active" : "inactive"}`}
                >
                  {rule.isActive ? "Active" : "Inactive"}
                </span>
                <div className="escalation-rule-actions">
                  <button
                    onClick={() => toggleRule(rule)}
                    aria-label={`${rule.isActive ? "Deactivate" : "Activate"} ${rule.name}`}
                    title={rule.isActive ? "Deactivate" : "Activate"}
                  >
                    {rule.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                  </button>
                  <button
                    onClick={() => openEditForm(rule)}
                    aria-label={`Edit ${rule.name}`}
                    title="Edit"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="delete"
                    onClick={() => deleteRule(rule)}
                    aria-label={`Delete ${rule.name}`}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      ) : (
        <>
          <section className="escalation-table" aria-label="Escalation history">
            <div className="escalation-table-head history-grid">
              <span>CLIENT / INVOICE</span>
              <span>CHANNEL</span>
              <span>MESSAGE</span>
              <span>SENT AT</span>
              <span>STATUS</span>
              <span>DETAILS</span>
            </div>
            {historyLoading ? (
              <div className="escalation-state">Loading escalation history...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="escalation-state">
                <h3>No escalation history found</h3>
                <p>Sent and failed follow-ups will appear here.</p>
              </div>
            ) : (
              filteredHistory.map((entry) => (
                <div className="escalation-row history-grid" key={entry.id}>
                  <div className="escalation-rule-name">
                    <strong>{entry.invoice?.client?.name || "Unknown client"}</strong>
                    <span>
                      {entry.invoice?.invoiceNumber || entry.invoiceId}
                    </span>
                  </div>
                  <strong>{entry.channel}</strong>
                  <span className="escalation-message">
                    {entry.content || "No message"}
                  </span>
                  <span>
                    {entry.sentAt
                      ? new Date(entry.sentAt).toLocaleString()
                      : "—"}
                  </span>
                  <span
                    className={`escalation-status ${entry.status?.toLowerCase() || "unknown"}`}
                  >
                    {entry.status || "Unknown"}
                  </span>
                  <button
                    className="escalation-icon-btn"
                    onClick={() => showHistoryDetails(entry)}
                    aria-label="View escalation details"
                  >
                    <FiEye />
                  </button>
                </div>
              ))
            )}
          </section>
          {pagination && pagination.totalPages > 1 && (
            <div className="escalation-pagination">
              <span>
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} records
              </span>
              <div>
                <button
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={!pagination.hasPreviousPage || historyLoading}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!pagination.hasNextPage || historyLoading}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div
          className="escalation-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <form className="escalation-modal" onSubmit={saveRule}>
            <div className="modal-header">
              <div>
                <h2>{editingRule ? "Edit escalation rule" : "New escalation rule"}</h2>
                <p>Configure when and how an invoice reminder is sent.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                disabled={saving}
              >
                <FiX />
              </button>
            </div>
            {actionError && <div className="escalation-error">{actionError}</div>}
            <label className="form-group">
              Rule name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </label>
            <label className="form-group">
              Description
              <textarea
                rows="2"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </label>
            <div className="escalation-form-row">
              <label className="form-group">
                Stage
                <select
                  value={form.stage}
                  onChange={(event) =>
                    setForm({ ...form, stage: event.target.value })
                  }
                >
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                Days from due date
                <input
                  type="number"
                  value={form.daysOffset}
                  onChange={(event) =>
                    setForm({ ...form, daysOffset: event.target.value })
                  }
                  required
                />
              </label>
            </div>
            <div className="escalation-form-row">
              <label className="form-group">
                Channel
                <select
                  value={form.channel}
                  onChange={(event) =>
                    setForm({ ...form, channel: event.target.value })
                  }
                >
                  {CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-group">
                Template
                <select
                  value={form.templateId}
                  onChange={(event) =>
                    setForm({ ...form, templateId: event.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select a template
                  </option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} · {template.channel} · {template.stage}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? "Saving..." : editingRule ? "Save changes" : "Create rule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedHistory && (
        <div
          className="escalation-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedHistory(null);
          }}
        >
          <div className="escalation-detail-modal">
            <div className="detail-icon">
              {selectedHistory.status === "FAILED" ? (
                <FiAlertTriangle />
              ) : (
                <FiMail />
              )}
            </div>
            <h2>Escalation history</h2>
            {detailLoading ? (
              <p>Loading details...</p>
            ) : (
              <>
                <div className="detail-info">
                  <div>
                    <span>Client</span>
                    <strong>
                      {selectedHistory.invoice?.client?.name || "Unknown client"}
                    </strong>
                  </div>
                  <div>
                    <span>Invoice</span>
                    <strong>
                      {selectedHistory.invoice?.invoiceNumber ||
                        selectedHistory.invoiceId}
                    </strong>
                  </div>
                  <div>
                    <span>Channel / status</span>
                    <strong>
                      {selectedHistory.channel} · {selectedHistory.status}
                    </strong>
                  </div>
                  <div>
                    <span>Sent at</span>
                    <strong>
                      {selectedHistory.sentAt
                        ? new Date(selectedHistory.sentAt).toLocaleString()
                        : "—"}
                    </strong>
                  </div>
                </div>
                <h3>{selectedHistory.subject || "Message"}</h3>
                <p className="history-content">{selectedHistory.content}</p>
                {selectedHistory.response && (
                  <p className="history-response">
                    Result: {selectedHistory.response}
                  </p>
                )}
              </>
            )}
            <button
              className="detail-close"
              onClick={() => setSelectedHistory(null)}
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
