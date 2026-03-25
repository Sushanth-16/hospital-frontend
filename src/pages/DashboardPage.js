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

function DashboardPage() {
  const user = getStoredUser();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    billing: 0
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError("");
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
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      }
    };

    loadStats();
  }, [user?.referenceId, user?.role]);

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
    </div>
  );
}

export default DashboardPage;
