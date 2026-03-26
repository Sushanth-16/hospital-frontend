import { useCallback, useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import { SYMPTOM_STORAGE_KEY } from "../constants/aiSymptoms";
import { specializationOptions } from "../constants/specializations";
import {
  appointmentService,
  billingService,
  doctorService,
  getErrorMessage,
  getStoredUser,
  patientService
} from "../services/api";

const initialForm = {
  disease: "",
  doctorId: "",
  appointmentDate: "",
  appointmentTime: ""
};

const getDoctorAvailabilitySlots = (doctor) => {
  const rawSlots = doctor?.availabilitySlots;

  if (Array.isArray(rawSlots)) {
    return rawSlots.filter(Boolean);
  }

  if (typeof rawSlots === "string") {
    return rawSlots
      .split(",")
      .map((slot) => slot.trim())
      .filter(Boolean);
  }

  return [];
};

function AppointmentsPage() {
  const user = getStoredUser();
  const savedSymptomSuggestion = (() => {
    try {
      const savedValue = localStorage.getItem(SYMPTOM_STORAGE_KEY);
      return savedValue ? JSON.parse(savedValue) : null;
    } catch (error) {
      return null;
    }
  })();
  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [formData, setFormData] = useState({
    ...initialForm,
    disease: savedSymptomSuggestion?.disease || ""
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [appointmentsData, billingsData, patientsData, doctorsData] = await Promise.all([
        appointmentService.getAll(),
        billingService.getAll(),
        patientService.getAll(),
        doctorService.getAll()
      ]);

      setAppointments(appointmentsData);
      setBillings(billingsData);
      setPatients(patientsData);
      setDoctors(doctorsData);

      if (user?.role === "PATIENT" && user.referenceId) {
        const patient = await patientService.getById(user.referenceId);
        setCurrentPatient(patient);
      }

      if (user?.role === "DOCTOR" && user.referenceId) {
        const doctor = await doctorService.getById(user.referenceId);
        setCurrentDoctor(doctor);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }, [user?.referenceId, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "doctorId" ? { appointmentTime: "" } : {})
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const nextDisease = formData.disease || currentPatient?.disease;

      if (!nextDisease) {
        setStatus("");
        setError("Please select a disease before requesting an appointment.");
        return;
      }

      if (!formData.appointmentTime) {
        setStatus("");
        setError("Please select an available doctor timing before requesting an appointment.");
        return;
      }

      if (currentPatient && currentPatient.disease !== nextDisease) {
        await patientService.update(currentPatient.id, {
          ...currentPatient,
          disease: nextDisease
        });
      }

      await appointmentService.create({
        patientId: user.referenceId,
        doctorId: Number(formData.doctorId),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime
      });
      setStatus("Appointment request sent to the doctor.");
      setFormData(initialForm);
      localStorage.removeItem(SYMPTOM_STORAGE_KEY);
      loadData();
    } catch (submitError) {
      setStatus("");
      setError(getErrorMessage(submitError));
    }
  };

  const handleStatusChange = async (appointmentId, nextStatus) => {
    try {
      setError("");
      await appointmentService.updateStatus(appointmentId, nextStatus);
      setStatus(
        nextStatus === "APPROVED"
          ? "Appointment approved successfully."
          : "Appointment rejected successfully."
      );
      loadData();
    } catch (updateError) {
      setStatus("");
      setError(getErrorMessage(updateError));
    }
  };

  const handlePayment = async (billingId) => {
    try {
      setError("");
      await billingService.updatePaymentStatus(billingId, "PAID");
      setStatus("Payment marked as completed.");
      loadData();
    } catch (paymentError) {
      setStatus("");
      setError(getErrorMessage(paymentError));
    }
  };

  const getPatientName = (patientId) =>
    patients.find((patient) => patient.id === patientId)?.name || "Unknown Patient";

  const getDoctorName = (doctorId) =>
    doctors.find((doctor) => doctor.id === doctorId)?.name || "Unknown Doctor";

  const getBilling = (appointmentId) =>
    billings.find((billing) => billing.appointmentId === appointmentId);

  const visibleAppointments = appointments.filter((appointment) => {
    if (user?.role === "PATIENT") {
      return appointment.patientId === user.referenceId;
    }

    if (user?.role === "DOCTOR") {
      return appointment.doctorId === user.referenceId;
    }

    return true;
  });

  const selectedDisease = formData.disease || currentPatient?.disease || "";
  const matchedDoctors = selectedDisease
    ? doctors.filter((doctor) => doctor.specialization === selectedDisease)
    : doctors;
  const selectedDoctor = doctors.find((doctor) => Number(formData.doctorId) === doctor.id);
  const selectedDoctorAvailability = getDoctorAvailabilitySlots(selectedDoctor);

  const columns = [
    {
      key: "patientId",
      header: "Patient",
      render: (row) => getPatientName(row.patientId)
    },
    {
      key: "doctorId",
      header: "Doctor",
      render: (row) => getDoctorName(row.doctorId)
    },
    {
      key: "appointmentDate",
      header: "Date"
    },
    {
      key: "appointmentTime",
      header: "Time"
    },
    {
      key: "status",
      header: "Status"
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => {
        const billing = getBilling(row.id);
        return billing ? `Rs. ${billing.amount}` : "-";
      }
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (row) => {
        const billing = getBilling(row.id);
        return billing ? billing.paymentStatus : "-";
      }
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Appointments</h2>
          <p>
            {user?.role === "PATIENT" &&
              "Send a request to a doctor that matches your disease specialization."}
            {user?.role === "DOCTOR" &&
              "Review incoming requests and approve or reject them."}
            {user?.role === "ADMIN" &&
              "Monitor all appointment requests and approvals across the system."}
          </p>
        </div>
      </div>

      {status && <div className="status-message success">{status}</div>}
      {error && <div className="status-message error">{error}</div>}

      {user?.role === "PATIENT" && (
        <div className="panel">
          <h3>Request Appointment</h3>
          {savedSymptomSuggestion?.disease && (
            <div className="status-message success">
              AI symptom checker suggested <strong>{savedSymptomSuggestion.disease}</strong>. You
              can keep it or choose a different disease category before sending your request.
            </div>
          )}
          <p className="helper-inline">
            Your current disease category is{" "}
            <strong>{currentPatient?.disease || savedSymptomSuggestion?.disease || "not set"}</strong>.
            {selectedDisease
              ? " Only doctors with that specialization are shown."
              : " Select a disease to narrow the doctor list, or pick from all available doctors."}
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormInput
                label="Disease"
                name="disease"
                type="select"
                value={formData.disease}
                onChange={handleChange}
                options={specializationOptions}
              />
              <FormInput
                label="Doctor"
                name="doctorId"
                type="select"
                value={formData.doctorId}
                onChange={handleChange}
                options={matchedDoctors.map((doctor) => ({
                  value: doctor.id,
                  label: `${doctor.name} - ${doctor.specialization}`
                }))}
              />
              <FormInput
                label="Date"
                name="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={handleChange}
              />
              <FormInput
                label="Time"
                name="appointmentTime"
                type="select"
                value={formData.appointmentTime}
                onChange={handleChange}
                options={selectedDoctorAvailability.map((slot) => ({
                  value: slot,
                  label: slot
                }))}
                required={selectedDoctorAvailability.length > 0}
              />
            </div>
            {formData.doctorId && selectedDoctorAvailability.length === 0 && (
              <p className="helper-inline">
                This doctor does not have any available timings configured yet.
              </p>
            )}
            {selectedDoctor && (
              <p className="helper-inline">
                Amount to pay: <strong>Rs. {selectedDoctor.consultationFee}</strong>
              </p>
            )}
            <div className="form-actions">
              <button type="submit" className="primary-button">
                Send Request
              </button>
            </div>
          </form>
        </div>
      )}

      {user?.role === "DOCTOR" && currentDoctor && (
        <div className="panel">
          <h3>Doctor Queue</h3>
          <p className="helper-inline">
            Logged in as <strong>{currentDoctor.name}</strong> for{" "}
            <strong>{currentDoctor.specialization}</strong>.
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={visibleAppointments}
        emptyMessage="No appointments found."
        renderActions={
          (appointment) => {
            const billing = getBilling(appointment.id);

            if (user?.role === "PATIENT" && billing?.paymentStatus === "UNPAID") {
              return (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handlePayment(billing.id)}
                >
                  Pay Now
                </button>
              );
            }

            if (user?.role === "DOCTOR" && appointment.status === "PENDING") {
              return (
                <>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleStatusChange(appointment.id, "APPROVED")}
                    disabled={billing?.paymentStatus !== "PAID"}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleStatusChange(appointment.id, "REJECTED")}
                  >
                    Reject
                  </button>
                </>
              );
            }

            return null;
          }
        }
      />
    </div>
  );
}

export default AppointmentsPage;
