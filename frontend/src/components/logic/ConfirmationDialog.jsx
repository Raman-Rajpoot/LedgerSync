import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

import "../style/confirmationDialog.css";

function ConfirmationDialog({
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  onCancel,
  onConfirm,
}) {
  const [submitting, setSubmitting] = useState(false);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, submitting]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onCancel();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="confirmation-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onCancel();
        }
      }}
    >
      <section
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-message"
      >
        <div className={`confirmation-dialog-icon ${variant}`}>
          <FiAlertTriangle aria-hidden="true" />
        </div>
        <h2 id="confirmation-dialog-title">{title}</h2>
        <p id="confirmation-dialog-message">{message}</p>
        <div className="confirmation-dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirmation-dialog-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`confirmation-dialog-confirm ${variant}`}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmationDialog;
