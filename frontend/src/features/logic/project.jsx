import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiFolder,
  FiMoreVertical,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiChevronRight,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { Link, Navigate, useNavigate } from "react-router-dom";

import "../style/project.css";
import projectService from "../../services/project.service";

function Project() {

  const token = localStorage.getItem("token");

  const organizationId =
    localStorage.getItem("organizationId") ||
    localStorage.getItem("organisationId");

  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("All");

  const [showModal, setShowModal] = useState(false);

  const [editingProject, setEditingProject] =
    useState(null);

  const [menuOpen, setMenuOpen] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    clientId: "",
    status: "Active",
    startDate: "",
    endDate: "",
    budget: "",
  });


  if (!token) {
    return <Navigate to="/login" replace />;
  }


  // ==========================================
  // FETCH PROJECTS
  // ==========================================

  useEffect(() => {

    fetchProjects();

    fetchClients();

  }, [organizationId]);


  const fetchProjects = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await projectService.getAllProjects();


      if (!response.success) {
        throw new Error(
          "Failed to fetch projects"
        );
      }
      console.log("Project response:", response);

      const result = response.data


      setProjects(
        result ||
        []
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load projects."
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================================
  // FETCH CLIENTS
  // ==========================================

  const fetchClients = async () => {

    try {

      const response = await fetch(
        `/v1/api/client?organizationId=${organizationId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );


      if (!response.ok) {
        throw new Error(
          "Failed to fetch clients"
        );
      }


      const result =
        await response.json();


      setClients(
        result.data ||
        result.clients ||
        []
      );

    } catch (err) {

      console.error(
        "Client fetch error:",
        err
      );

    }
  };


  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

  };


  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  const openAddModal = () => {

    setEditingProject(null);

    setForm({
      name: "",
      description: "",
      clientId: "",
      status: "Active",
      startDate: "",
      endDate: "",
      budget: "",
    });

    setShowModal(true);

  };


  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (project) => {

    setEditingProject(project);

    setForm({
      name: project.name || "",

      description:
        project.description || "",

      clientId:
        project.clientId ||
        project.client?.id ||
        "",

      status:
        project.status ||
        "Active",

      startDate:
        project.startDate
          ? project.startDate.slice(0, 10)
          : "",

      endDate:
        project.endDate
          ? project.endDate.slice(0, 10)
          : "",

      budget:
        project.budget || "",
    });

    setShowModal(true);

    setMenuOpen(null);

  };


  // ==========================================
  // CREATE / UPDATE PROJECT
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();


    if (!form.name.trim()) {

      alert(
        "Project name is required"
      );

      return;

    }


    if (!form.clientId) {

      alert(
        "Please select a client"
      );

      return;

    }


    try {

     let response;

      if (editingProject) {
          response = await projectService.updateProject(
          editingProject.id,
          projectData
      );
      } else {
            response = await projectService.createProject(
            projectData
          );
        }

if (response.success) {
  console.log("Project saved:", response);
}
     

      if (!response.success) {

        
        throw new Error(
          response.message ||
          "Operation failed"
        );

      }


      setShowModal(false);

      await fetchProjects();


    } catch (err) {

      console.error(err);

      alert(
        err.message ||
        "Something went wrong"
      );

    }

  };


  // ==========================================
  // DELETE PROJECT
  // ==========================================

  const deleteProject = async (
    projectId
  ) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this project?"
      );


    if (!confirmDelete) {
      return;
    }


    try {

      const response =
        await projectService.deleteProject(projectId);


      if (!response.success) {

        throw new Error(
          "Failed to delete project"
        );

      }
   condsole.log(response);

      setProjects((prev) =>
        prev.filter(
          (project) =>
            project.id !== projectId
        )
      );


    } catch (err) {

      console.error(err);

      alert(
        "Unable to delete project."
      );

    }

  };


  // ==========================================
  // FILTER PROJECTS
  // ==========================================

  const filteredProjects =
    projects.filter((project) => {

      const searchValue =
        search.toLowerCase();


      const matchesSearch =
        project.name
          ?.toLowerCase()
          .includes(searchValue) ||

        project.client?.name
          ?.toLowerCase()
          .includes(searchValue);


      const matchesStatus =
        status === "All" ||
        project.status === status;


      return (
        matchesSearch &&
        matchesStatus
      );

    });


  // ==========================================
  // FORMAT MONEY
  // ==========================================

  const formatMoney = (amount) => {

    return `₹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`;

  };


  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {

    if (!date) {
      return "--";
    }

    return new Date(date)
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="project-loading">

        <div className="project-spinner" />

        <h3>
          Loading projects...
        </h3>

      </div>

    );

  }


  return (

    <div className="project-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <div className="project-header">

        <div>

          <h1>
            Projects
          </h1>

          <p>
            Manage your projects,
            clients and project progress.
          </p>

        </div>


        <button
          className="project-add-btn"
          onClick={openAddModal}
        >

          <FiPlus />

          Add Project

        </button>

      </div>


      {/* =====================================
          SUMMARY
      ===================================== */}

      <div className="project-summary">


        <div className="project-summary-card">

          <div className="summary-icon purple">

            <FiFolder />

          </div>

          <div>

            <span>
              Total Projects
            </span>

            <strong>
              {projects.length}
            </strong>

          </div>

        </div>


        <div className="project-summary-card">

          <div className="summary-icon green">

            <FiUsers />

          </div>

          <div>

            <span>
              Active Projects
            </span>

            <strong>
              {
                projects.filter(
                  (p) =>
                    p.status === "Active"
                ).length
              }
            </strong>

          </div>

        </div>


        <div className="project-summary-card">

          <div className="summary-icon orange">

            <FiDollarSign />

          </div>

          <div>

            <span>
              Total Budget
            </span>

            <strong>

              {formatMoney(
                projects.reduce(
                  (sum, project) =>
                    sum +
                    Number(
                      project.budget ||
                      0
                    ),
                  0
                )
              )}

            </strong>

          </div>

        </div>


        <div className="project-summary-card">

          <div className="summary-icon blue">

            <FiCalendar />

          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {
                projects.filter(
                  (p) =>
                    p.status ===
                    "Completed"
                ).length
              }
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================
          SEARCH / FILTER
      ===================================== */}

      <div className="project-toolbar">


        <div className="project-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >

          <option value="All">
            All Status
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Completed">
            Completed
          </option>

          <option value="On Hold">
            On Hold
          </option>

        </select>


        <button
          className="project-refresh"
          onClick={
            fetchProjects
          }
        >

          <FiRefreshCw />

        </button>

      </div>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="project-error">

          {error}

          <button
            onClick={
              fetchProjects
            }
          >
            Retry
          </button>

        </div>

      )}


      {/* =====================================
          PROJECT LIST
      ===================================== */}

      <div className="project-list">

        {filteredProjects.length ===
        0 ? (

          <div className="project-empty">

            <FiFolder />

            <h3>
              No Projects Found
            </h3>

            <p>
              Create your first project
              to get started.
            </p>

            <button
              onClick={
                openAddModal
              }
            >

              <FiPlus />

              Add Project

            </button>

          </div>

        ) : (

          filteredProjects.map(
            (project) => (

              <div
                className="project-card"
                key={project.id}
              >


                {/* CARD HEADER */}

                <div className="project-card-header">

                  <div className="project-title">

                    <div className="project-icon">

                      <FiFolder />

                    </div>

                    <div>

                      <h3>
                        {project.name}
                      </h3>

                      <span>
                        {project.client?.name ||
                          "No Client"}
                      </span>

                    </div>

                  </div>


                  <div className="project-actions">

                    <span
                      className={`project-status ${(
                        project.status ||
                        ""
                      )
                        .toLowerCase()
                        .replace(
                          " ",
                          "-"
                        )}`}
                    >
                      {project.status ||
                        "Active"}
                    </span>


                    <button
                      onClick={() =>
                        setMenuOpen(
                          menuOpen ===
                          project.id
                            ? null
                            : project.id
                        )
                      }
                    >

                      <FiMoreVertical />

                    </button>


                    {menuOpen ===
                      project.id && (

                      <div className="project-menu">

                        <button
                          onClick={() =>
                            openEditModal(
                              project
                            )
                          }
                        >

                          <FiEdit2 />

                          Edit

                        </button>


                        <button
                          className="delete"
                          onClick={() =>
                            deleteProject(
                              project.id
                            )
                          }
                        >

                          <FiTrash2 />

                          Delete

                        </button>

                      </div>

                    )}

                  </div>

                </div>


                {/* DESCRIPTION */}

                <p className="project-description">

                  {project.description ||
                    "No project description available."}

                </p>


                {/* PROJECT INFO */}

                <div className="project-info">


                  <div>

                    <FiCalendar />

                    <div>

                      <span>
                        Start Date
                      </span>

                      <strong>
                        {formatDate(
                          project.startDate
                        )}
                      </strong>

                    </div>

                  </div>


                  <div>

                    <FiCalendar />

                    <div>

                      <span>
                        End Date
                      </span>

                      <strong>
                        {formatDate(
                          project.endDate
                        )}
                      </strong>

                    </div>

                  </div>


                  <div>

                    <FiDollarSign />

                    <div>

                      <span>
                        Budget
                      </span>

                      <strong>
                        {formatMoney(
                          project.budget
                        )}
                      </strong>

                    </div>

                  </div>

                </div>


                {/* FOOTER */}

                <div className="project-card-footer">

                  <span>

                    Created{" "}

                    {formatDate(
                      project.createdAt
                    )}

                  </span>


                  <Link
                    to={`/project/${project.id}`}
                  >

                    View Project

                    <FiChevronRight />

                  </Link>

                </div>

              </div>

            )
          )

        )}

      </div>


      {/* =====================================
          ADD / EDIT MODAL
      ===================================== */}

      {showModal && (

        <div
          className="project-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="project-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>

                  {editingProject
                    ? "Edit Project"
                    : "Add New Project"}

                </h2>

                <p>
                  Add project details
                  below.
                </p>

              </div>


              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >


              {/* PROJECT NAME */}

              <div className="form-group">

                <label>
                  Project Name
                </label>

                <input
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Website Development"
                  required
                />

              </div>


              {/* CLIENT */}

              <div className="form-group">

                <label>
                  Client
                </label>

                <select
                  name="clientId"
                  value={
                    form.clientId
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Select Client
                  </option>

                  {clients.map(
                    (client) => (

                      <option
                        key={
                          client.id
                        }
                        value={
                          client.id
                        }
                      >

                        {client.name}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Describe the project..."
                  rows="3"
                />

              </div>


              {/* STATUS */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="On Hold">
                      On Hold
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Budget
                  </label>

                  <input
                    type="number"
                    name="budget"
                    value={
                      form.budget
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="50000"
                  />

                </div>

              </div>


              {/* DATES */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="startDate"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    End Date
                  </label>

                  <input
                    type="date"
                    name="endDate"
                    value={
                      form.endDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-project"
                >

                  {editingProject
                    ? "Update Project"
                    : "Create Project"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}

export default Project;