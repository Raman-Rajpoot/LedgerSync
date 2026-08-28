import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ClientService from "../../services/client.service";
import "../style/addClient.css";

const AddClient = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    gstNumber: "",
    notes: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);

    console.log("check Name")
    if (!formData.name.trim()) {
      return toast.error("Client name is required");
    }
    
    // if (!formData.phone.trim()) {
    //   return toast.error("Phone number is required");
    // }

    // if (!/^\d{10}$/.test(formData.phone)) {
    //   return toast.error("Enter a valid 10-digit phone number");
    // }
console.log("check mail")
    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      return toast.error("Enter a valid email address");
    }

    try {
      setLoading(true);
      const organizationId = localStorage.getItem('organizationId') || localStorage.getItem('organisationId');
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        companyName: formData.company,
        customNotes: formData.notes,
        project: formData.project || '',
        ...(organizationId ? { organizationId, organisationId: organizationId } : {}),
      };

      await ClientService.createClient(payload);

      toast.success("Client added successfully");
      navigate("/clients");
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-client-page">
      <div className="client-card">

        <div className="card-header">
          <h2>Add New Client</h2>
          <p>Create a client to manage invoices and ledger records.</p>
        </div>

        <form onSubmit={handleSubmit} className="client-form">

          <div className="form-group">
            <label>Client Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter client name"
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Enter company name"
            />
          </div>


          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows="4"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
            />
          </div>

          <div className="button-group">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/clients")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Client"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddClient;