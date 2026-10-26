
import "../style/clientCard.css";

const ClientCard = ({ company, name, mail, status }) => {
  return (
    <div className="client-card">
      <div className="client-avatar">
        {(company || name)?.charAt(0)?.toUpperCase() || "?"}
      </div>

      <div className="client-details">
        <div className="client-primary">
          <h3 className="company">{company || "Unnamed company"}</h3>
          <span className="client-mail">{mail || "No email provided"}</span>
        </div>
        {name && <p className="client-name">{name}</p>}
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
    </div>
  );
};

export default ClientCard;