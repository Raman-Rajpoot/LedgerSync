import React from 'react';
import '../style/clientCard.css';

const ClientCard = ({ name, company,mail, status }) => {
  return (
    <div className="client-card">
      {/* Left Group */}
      {/* <div className="client-info"> */}
        <div className="client-avatar">
          {name && name.length ? name.charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <h3 className="client-name">{name}</h3>
          <p className="client-mail">{mail}</p>
        </div>
        <div>
          <p className='"client-company'>{company}</p>
        </div>
      {/* </div> */}

      {/* Right Group */}
      <div className={`client-status ${status === 'ACTIVE' ? 'status-active' : 'status-overdue'}`}>
        {status}
      </div>
    </div>
  );
};

export default ClientCard;