import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import { specializationOptions } from "../constants/specializations";
import { doctorService, getErrorMessage, isAdmin } from "../services/api";

const initialForm = {
  name: "",
  specialization: "",
  phone: "",
  email: ""
};

function DoctorsPage() {
  const adminUser = isAdmin();
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadDoctors = async () => {
    try {
      setError("");
      const data = await doctorService.getAll();
      setDoctors(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  if (!adminUser) {
    return <div className="empty-state">Only admin can manage doctors.</div>;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        await doctorService.update(editingId, formData);
        setStatus("Doctor updated successfully.");
      } else {
        await doctorService.create(formData);
        setStatus("Doctor added successfully.");
      }

      resetForm();
      loadDoctors();
    } catch (submitError) {
      setStatus("");
      setError(getErrorMessage(submitError));
    }
  };

  const handleEdit = (doctor) => {
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      phone: doctor.phone,
      email: doctor.email
    });
    setEditingId(doctor.id);
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      await doctorService.remove(id);
      setStatus("Doctor deleted successfully.");
      if (editingId === id) {
        resetForm();
      }
      loadDoctors();
    } catch (deleteError) {
      setStatus("");
      setError(getErrorMessage(deleteError));
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "specialization", header: "Specialization" },
    { key: "consultationFee", header: "Fee" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Doctor Management</h2>
          <p>Manage doctor profiles, contacts, and specialization details.</p>
        </div>
      </div>

      <div className="panel">
        <h3>{editingId ? "Edit Doctor" : "Add Doctor"}</h3>
        {status && <div className="status-message success">{status}</div>}
        {error && <div className="status-message error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <FormInput
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <FormInput
              label="Specialization"
              name="specialization"
              type="select"
              value={formData.specialization}
              onChange={handleChange}
              options={specializationOptions}
            />
            <FormInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? "Update Doctor" : "Add Doctor"}
            </button>
            {editingId && (
              <button type="button" className="secondary-button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <DataTable
        columns={columns}
        data={doctors}
        emptyMessage="No doctors found."
        renderActions={(doctor) => (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleEdit(doctor)}
            >
              Edit
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => handleDelete(doctor.id)}
            >
              Delete
            </button>
          </>
        )}
      />
    </div>
  );
}

export default DoctorsPage;
