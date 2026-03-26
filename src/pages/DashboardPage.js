import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import {
  appointmentService,
  billingService,
  doctorService,
  getErrorMessage,
  getStoredUser,
  patientService
} from "../services/api";

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

function DashboardPage() {
  const user = getStoredUser();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    billing: 0
  });
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [slotInput, setSlotInput] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError("");
        setStatus("");
        const [patients, doctors, appointments, billings] = await Promise.all([
          patientService.getAll(),
          doctorService.getAll(),
          appointmentService.getAll(),
          billingService.getAll()
        ]);

        const patientAppointments = user?.role === "PATIENT"
          ? appointments.filter((appointment) => appointment.patientId === user.referenceId)
          : appointments;
        const doctorAppointments = user?.role === "DOCTOR"
          ? appointments.filter((appointment) => appointment.doctorId === user.referenceId)
          : appointments;
        const visibleAppointments =
          user?.role === "PATIENT"
            ? patientAppointments
            : user?.role === "DOCTOR"
              ? doctorAppointments
              : appointments;
        const visibleBillings =
          user?.role === "PATIENT"
            ? billings.filter((billing) => billing.patientId === user.referenceId)
            : user?.role === "DOCTOR"
              ? billings.filter((billing) => billing.doctorId === user.referenceId)
              : billings;

        setStats({
          patients: user?.role === "ADMIN" ? patients.length : 1,
          doctors: user?.role === "ADMIN" ? doctors.length : 1,
          appointments: visibleAppointments.length,
          billing: visibleBillings.reduce((total, billing) => total + billing.amount, 0)
        });

        if (user?.role === "DOCTOR" && user.referenceId) {
          const doctor = await doctorService.getById(user.referenceId);
          setCurrentDoctor(doctor);
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      }
    };

    loadStats();
  }, [user?.referenceId, user?.role]);

  const doctorSlots = parseAvailabilitySlots(currentDoctor?.availabilitySlots);

  const handleAddDoctorSlot = () => {
    setError("");
    setStatus("");

    const formattedSlot = formatTimeLabel(slotInput);

    if (!formattedSlot) {
      setError("Please choose a time from the clock first.");
      return;
    }

    if (doctorSlots.includes(formattedSlot)) {
      setError("That timing is already added.");
      return;
    }

    setCurrentDoctor((current) => ({
      ...current,
      availabilitySlots: [...doctorSlots, formattedSlot].join(", ")
    }));
    setSlotInput("");
  };

  const handleRemoveDoctorSlot = (slotToRemove) => {
    setCurrentDoctor((current) => ({
      ...current,
      availabilitySlots: parseAvailabilitySlots(current?.availabilitySlots)
        .filter((slot) => slot !== slotToRemove)
        .join(", ")
    }));
  };

  const handleSaveDoctorAvailability = async () => {
    if (!currentDoctor?.id) {
      return;
    }

    try {
      setError("");
      await doctorService.update(currentDoctor.id, currentDoctor);
      setStatus("Your available timings were updated successfully.");
    } catch (saveError) {
      setStatus("");
      setError(getErrorMessage(saveError));
    }
  };

  return (
    <div
      className={`dashboard-page ${user?.role === "PATIENT" ? "patient-dashboard" : ""} ${
        user?.role === "DOCTOR" ? "doctor-dashboard" : ""
      } ${user?.role === "ADMIN" ? "admin-dashboard" : ""}`}
    >
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Monitor hospital activity and key counts from one place.</p>
        </div>
      </div>

      {status && <div className="status-message success">{status}</div>}
      {error && <div className="status-message error">{error}</div>}

      {user?.role === "PATIENT" && (
        <section className="patient-hero">
          <div className="patient-hero-copy">
            <span className="patient-hero-tag">Wellness Hub</span>
            <h3>Welcome, {user?.name || user?.username}</h3>
            <p>Designed for calmer care, clearer steps, and a more graceful healing journey.</p>
          </div>
          <div className="patient-hero-orb" aria-hidden="true" />
        </section>
      )}

      {user?.role === "DOCTOR" && (
        <section className="doctor-hero">
          <div className="doctor-hero-copy">
            <span className="doctor-hero-tag">Clinical Desk</span>
            <h3>Welcome, Dr. {user?.name || user?.username}</h3>
            <p>Refined for confident decisions, smoother approvals, and a sharper daily rhythm.</p>
          </div>
          <div className="doctor-hero-orb" aria-hidden="true" />
        </section>
      )}

      {user?.role === "ADMIN" && (
        <section className="admin-hero">
          <div className="admin-hero-copy">
            <span className="admin-hero-tag">Operations Suite</span>
            <h3>Welcome, {user?.name || user?.username}</h3>
            <p>Built for command, visibility, and elegant control across every moving part of care.</p>
          </div>
          <div className="admin-hero-orb" aria-hidden="true" />
        </section>
      )}

      <div className="card-grid">
        <StatCard
          title={getStoredUser()?.role === "ADMIN" ? "Total Patients" : "My Profile"}
          value={stats.patients}
          subtitle=""
        />
        <StatCard
          title={getStoredUser()?.role === "ADMIN" ? "Total Doctors" : "Assigned Access"}
          value={stats.doctors}
          subtitle=""
        />
        <StatCard
          title={getStoredUser()?.role === "DOCTOR" ? "My Requests" : "Appointments"}
          value={stats.appointments}
          subtitle=""
        />
        <StatCard
          title="Billing"
          value={`Rs. ${stats.billing}`}
          subtitle=""
        />
      </div>

      <div className="panel">
        <h3>
          {user?.role === "ADMIN" && "Command Center"}
          {user?.role === "DOCTOR" && "Doctor Focus"}
          {user?.role === "PATIENT" && "Care Journey"}
        </h3>
        <p>
          {user?.role === "ADMIN" &&
            "Track the full hospital flow from registrations to paid appointments, and keep operations balanced across doctors and patients."}
          {user?.role === "DOCTOR" &&
            "Review paid requests first, approve the right appointments, and keep your consultation queue moving without delays."}
          {user?.role === "PATIENT" &&
            "Choose the right specialist, complete payment, and follow your appointment request through approval to confirmation."}
        </p>
      </div>

      {user?.role === "DOCTOR" && currentDoctor && (
        <div className="panel">
          <h3>My Availability</h3>
          <p className="helper-inline">
            Set the timings when patients are allowed to request appointments with you.
          </p>
          <div className="availability-builder">
            <input
              id="doctor-dashboard-slot-picker"
              type="time"
              value={slotInput}
              onChange={(event) => setSlotInput(event.target.value)}
            />
            <button
              type="button"
              className="secondary-button"
              onClick={handleAddDoctorSlot}
            >
              Add Slot
            </button>
          </div>
          {doctorSlots.length > 0 ? (
            <div className="slot-list dashboard-slot-list">
              {doctorSlots.map((slot) => (
                <span key={slot} className="slot-pill">
                  {slot}
                  <button
                    type="button"
                    className="slot-remove-button"
                    onClick={() => handleRemoveDoctorSlot(slot)}
                  >
                    Remove
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="helper-inline">No timings added yet.</p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleSaveDoctorAvailability}
            >
              Save Availability
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
