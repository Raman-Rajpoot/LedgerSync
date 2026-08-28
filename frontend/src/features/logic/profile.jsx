import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiEdit2,
  FiSave,
  FiX,
  FiLock,
  FiArrowLeft,
} from "react-icons/fi";

import "../style/profile.css";

function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    state: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    state: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  /* ==========================================
     GET LOGGED-IN USER
  ========================================== */

  useEffect(() => {

    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {

      const user =
        JSON.parse(storedUser);

      const userData = {
        name:
          user.name ||
          user.fullName ||
          "",

        email:
          user.email ||
          "",

        phone:
          user.phone ||
          "",

        company:
          user.company ||
          user.companyName ||
          "",

        city:
          user.city ||
          "",

        state:
          user.state ||
          "",
      };

      setProfile(userData);
      setFormData(userData);

    } catch (err) {

      console.error(
        "Failed to read user:",
        err
      );

      setError(
        "Failed to load profile"
      );

    } finally {

      setLoading(false);

    }

  }, [navigate]);


  /* ==========================================
     HANDLE INPUT
  ========================================== */

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  };


  /* ==========================================
     SAVE PROFILE
  ========================================== */

  const handleSave = async () => {

    setSaving(true);
    setError("");
    setSuccess("");

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/v1/api"}/profile`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              formData
            ),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to update profile"
        );

      }


      setProfile(formData);

      /*
       * Keep localStorage user
       * synchronized.
       */

      const storedUser =
        localStorage.getItem("user");

      if (storedUser) {

        const user =
          JSON.parse(storedUser);

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...user,
            ...formData,
          })
        );

      }


      setEditMode(false);

      setSuccess(
        "Profile updated successfully"
      );

    } catch (err) {

      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.message ||
        "Failed to update profile"
      );

    } finally {

      setSaving(false);

    }

  };


  /* ==========================================
     CANCEL EDIT
  ========================================== */

  const handleCancel = () => {

    setFormData(profile);

    setEditMode(false);

    setError("");
    setSuccess("");

  };


  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {

    return (
      <div className="profile-page">

        <div className="profile-loading">

          <div className="profile-spinner"></div>

          <p>
            Loading profile...
          </p>

        </div>

      </div>
    );

  }


  /* ==========================================
     PROFILE
  ========================================== */

  return (

    <div className="profile-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="profile-header">

        <div>

          <button
            className="profile-back"
            onClick={() =>
              navigate(-1)
            }
          >
            <FiArrowLeft />
            Back
          </button>

          <h1>
            My Profile
          </h1>

          <p>
            Manage your personal information
            and account details.
          </p>

        </div>


        {!editMode ? (

          <button
            className="profile-edit-btn"
            onClick={() => {
              setEditMode(true);
              setSuccess("");
              setError("");
            }}
          >

            <FiEdit2 />

            Edit Profile

          </button>

        ) : (

          <div className="profile-actions">

            <button
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >

              <FiX />

              Cancel

            </button>


            <button
              className="profile-save-btn"
              onClick={handleSave}
              disabled={saving}
            >

              <FiSave />

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>

          </div>

        )}

      </div>


      {/* =====================================
          ALERTS
      ===================================== */}

      {error && (

        <div className="profile-alert error">

          {error}

        </div>

      )}


      {success && (

        <div className="profile-alert success">

          {success}

        </div>

      )}


      {/* =====================================
          PROFILE CONTENT
      ===================================== */}

      <div className="profile-content">


        {/* =================================
            PROFILE SUMMARY
        ================================= */}

        <div className="profile-summary card">

          <div className="profile-avatar-large">

            {(
              profile.name ||
              "R"
            )
              .charAt(0)
              .toUpperCase()}

          </div>


          <h2>
            {profile.name ||
              "Your Name"}
          </h2>

          <p>
            {profile.email ||
              "No email added"}
          </p>


          <div className="profile-role">

            <FiBriefcase />

            LedgerSync User

          </div>

        </div>


        {/* =================================
            PERSONAL INFORMATION
        ================================= */}

        <div className="profile-details card">

          <div className="section-title">

            <div>

              <h2>
                Personal Information
              </h2>

              <p>
                Your basic account information
              </p>

            </div>

            <FiUser />

          </div>


          <div className="profile-grid">


            {/* NAME */}

            <div className="profile-field">

              <label>
                Full Name
              </label>

              {editMode ? (

                <div className="input-wrapper">

                  <FiUser />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your name"
                  />

                </div>

              ) : (

                <div className="profile-value">

                  <FiUser />

                  <span>
                    {profile.name ||
                      "Not provided"}
                  </span>

                </div>

              )}

            </div>


            {/* EMAIL */}

            <div className="profile-field">

              <label>
                Email Address
              </label>

              {editMode ? (

                <div className="input-wrapper">

                  <FiMail />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={
                      handleChange
                    }
                    placeholder="Enter email"
                  />

                </div>

              ) : (

                <div className="profile-value">

                  <FiMail />

                  <span>
                    {profile.email ||
                      "Not provided"}
                  </span>

                </div>

              )}

            </div>


            {/* PHONE */}

            <div className="profile-field">

              <label>
                Phone Number
              </label>

              {editMode ? (

                <div className="input-wrapper">

                  <FiPhone />

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={
                      handleChange
                    }
                    placeholder="Enter phone number"
                  />

                </div>

              ) : (

                <div className="profile-value">

                  <FiPhone />

                  <span>
                    {profile.phone ||
                      "Not provided"}
                  </span>

                </div>

              )}

            </div>


            {/* COMPANY */}

            <div className="profile-field">

              <label>
                Company
              </label>

              {editMode ? (

                <div className="input-wrapper">

                  <FiBriefcase />

                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={
                      handleChange
                    }
                    placeholder="Company name"
                  />

                </div>

              ) : (

                <div className="profile-value">

                  <FiBriefcase />

                  <span>
                    {profile.company ||
                      "Not provided"}
                  </span>

                </div>

              )}

            </div>


            {/* CITY */}

            <div className="profile-field">

              <label>
                City
              </label>

              {editMode ? (

                <div className="input-wrapper">

                  <FiMapPin />

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={
                      handleChange
                    }
                    placeholder="City"
                  />

                </div>

              ) : (

                <div className="profile-value">

                  <FiMapPin />

                  <span>
                    {profile.city ||
                      "Not provided"}
                  </span>

                </div>

              )}

            </div>


            {/* STATE */}

            <div className="profile-field">

              <label>
                State
              </label>

              {editMode ? (

                <div className="input-wrapper">

                  <FiMapPin />

                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={
                      handleChange
                    }
                    placeholder="State"
                  />

                </div>

              ) : (

                <div className="profile-value">

                  <FiMapPin />

                  <span>
                    {profile.state ||
                      "Not provided"}
                  </span>

                </div>

              )}

            </div>

          </div>

        </div>


        {/* =================================
            SECURITY
        ================================= */}

        <div className="profile-security card">

          <div className="section-title">

            <div>

              <h2>
                Security
              </h2>

              <p>
                Manage your account security
              </p>

            </div>

            <FiLock />

          </div>


          <div className="security-row">

            <div className="security-icon">

              <FiLock />

            </div>


            <div className="security-text">

              <h3>
                Password
              </h3>

              <p>
                Keep your password secure
                and change it regularly.
              </p>

            </div>


            <button
              className="change-password-btn"
              onClick={() =>
                navigate(
                  "/change-password"
                )
              }
            >
              Change Password
            </button>

          </div>

        </div>

      </div>

    </div>

  );
}

export default Profile;