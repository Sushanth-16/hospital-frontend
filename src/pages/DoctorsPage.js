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

const buildSlotsFromRange = (startTime, endTime, intervalMinutes) => {
  if (!startTime || !endTime || !intervalMinutes) {
    return [];
  }

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  if (endTotalMinutes <= startTotalMinutes) {
    return [];
  }

  const slots = [];

  for (let currentMinutes = startTotalMinutes; currentMinutes < endTotalMinutes; currentMinutes += intervalMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(formatTimeLabel(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`));
  }

  return slots;
};

function DoctorsPage() {
  const adminUser = isAdmin();
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotDuration, setSlotDuration] = useState("30");
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
    setStartTime("");
    setEndTime("");
    setSlotDuration("30");
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
    setStartTime("");
    setEndTime("");
    setSlotDuration("30");
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
    const generatedSlots = buildSlotsFromRange(startTime, endTime, Number(slotDuration));

    if (!startTime || !endTime) {
      setError("Please choose both from and to times.");
      return;
    }

    if (generatedSlots.length === 0) {
      setError("Please choose a valid time range.");
      return;
    }

    const nextSlots = [...new Set([...selectedSlots, ...generatedSlots])];

    setFormData((current) => ({
      ...current,
      availabilitySlots: nextSlots.join(", ")
    }));
    setStartTime("");
    setEndTime("");
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
                id="availability-start-picker"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
              <span className="range-separator">to</span>
              <input
                id="availability-end-picker"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
              <select
                value={slotDuration}
                onChange={(event) => setSlotDuration(event.target.value)}
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </select>
              <button
                type="button"
                className="secondary-button"
                onClick={handleAddSlot}
              >
                Add Range
              </button>
            </div>
            <p className="helper-inline">Pick a from and to time to generate appointment slots.</p>
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
