import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import { specializationOptions } from "../constants/specializations";
import { doctorService, getErrorMessage, isAdmin } from "../services/api";

const initialForm = {
  name: "",
  specialization: "",
  phone: "",
  email: "",
  availabilitySlots: ""
};

const parseAvailabilitySlots = (availabilitySlots) =>
  (Array.isArray(availabilitySlots) ? availabilitySlots : (availabilitySlots || "").split(","))
    .map((slot) => slot.trim())
    .filter(Boolean);

const formatTimeLabel = (timeValue) => {
  if (!timeValue) {
    return "";
  }

  const [hoursText, minutes] = timeValue.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  return `${String(formattedHours).padStart(2, "0")}:${minutes} ${suffix}`;
};

function DoctorsPage() {
  const adminUser = isAdmin();
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [slotInput, setSlotInput] = useState("");
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
    setSlotInput("");
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
      email: doctor.email,
      availabilitySlots: parseAvailabilitySlots(doctor.availabilitySlots).join(", ")
    });
    setSlotInput("");
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
    {
      key: "availabilitySlots",
      header: "Available Timings",
      render: (doctor) =>
        Array.isArray(doctor.availabilitySlots)
          ? doctor.availabilitySlots.join(", ")
          : doctor.availabilitySlots || "-"
    },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" }
  ];

  const selectedSlots = parseAvailabilitySlots(formData.availabilitySlots);

  const handleAddSlot = () => {
    setError("");

    const formattedSlot = formatTimeLabel(slotInput);

    if (!formattedSlot) {
      setError("Please choose a time from the clock first.");
      return;
    }

    if (selectedSlots.includes(formattedSlot)) {
      setError("That timing is already added for this doctor.");
      return;
    }

    setFormData((current) => ({
      ...current,
      availabilitySlots: [...selectedSlots, formattedSlot].join(", ")
    }));
    setSlotInput("");
  };

  const handleRemoveSlot = (slotToRemove) => {
    setFormData((current) => ({
      ...current,
      availabilitySlots: parseAvailabilitySlots(current.availabilitySlots)
        .filter((slot) => slot !== slotToRemove)
        .join(", ")
    }));
  };

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

          <div className="form-group">
            <label htmlFor="availability-slot-picker">Available Timings</label>
            <div className="availability-builder">
              <input
                id="availability-slot-picker"
                type="time"
                value={slotInput}
                onChange={(event) => setSlotInput(event.target.value)}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={handleAddSlot}
              >
                Add Slot
              </button>
            </div>
            <p className="helper-inline">Use the clock picker to add each doctor time slot.</p>
            {selectedSlots.length > 0 ? (
              <div className="slot-list">
                {selectedSlots.map((slot) => (
                  <span key={slot} className="slot-pill">
                    {slot}
                    <button
                      type="button"
                      className="slot-remove-button"
                      onClick={() => handleRemoveSlot(slot)}
                    >
                      Remove
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="helper-inline">No timings added yet.</p>
            )}
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
