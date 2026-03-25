import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import { specializationOptions } from "../constants/specializations";
import { getErrorMessage, isAdmin, patientService } from "../services/api";

const initialForm = {
  name: "",
  age: "",
  gender: "",
  phone: "",
  disease: ""
};

function PatientsPage() {
  const adminUser = isAdmin();
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadPatients = async () => {
    try {
      setError("");
      const data = await patientService.getAll();
      setPatients(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  if (!adminUser) {
    return <div className="empty-state">Only admin can manage patients.</div>;
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
        await patientService.update(editingId, formData);
        setStatus("Patient updated successfully.");
      } else {
        await patientService.create(formData);
        setStatus("Patient added successfully.");
      }

      resetForm();
      loadPatients();
    } catch (submitError) {
      setStatus("");
      setError(getErrorMessage(submitError));
    }
  };

  const handleEdit = (patient) => {
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      disease: patient.disease
    });
    setEditingId(patient.id);
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      await patientService.remove(id);
      setStatus("Patient deleted successfully.");
      if (editingId === id) {
        resetForm();
      }
      loadPatients();
    } catch (deleteError) {
      setStatus("");
      setError(getErrorMessage(deleteError));
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "age", header: "Age" },
    { key: "gender", header: "Gender" },
    { key: "phone", header: "Phone" },
    { key: "disease", header: "Disease" }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Patient Management</h2>
          <p>Add, update, and maintain patient records.</p>
        </div>
      </div>

      <div className="panel">
        <h3>{editingId ? "Edit Patient" : "Add Patient"}</h3>
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
              label="Age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
            />
            <FormInput
              label="Gender"
              name="gender"
              type="select"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" }
              ]}
            />
            <FormInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <FormInput
              label="Disease"
              name="disease"
              type="select"
              value={formData.disease}
              onChange={handleChange}
              options={specializationOptions}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              {editingId ? "Update Patient" : "Add Patient"}
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
        data={patients}
        emptyMessage="No patients found."
        renderActions={(patient) => (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleEdit(patient)}
            >
              Edit
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => handleDelete(patient.id)}
            >
              Delete
            </button>
          </>
        )}
      />
    </div>
  );
}

export default PatientsPage;
