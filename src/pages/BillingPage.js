import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import {
  billingService,
  doctorService,
  getErrorMessage,
  isAdmin,
  patientService
} from "../services/api";

const initialFilters = {
  paymentStatus: "",
  patientSearch: ""
};

function BillingPage() {
  const [billings, setBillings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        setError("");
        const [billingData, patientData, doctorData] = await Promise.all([
          billingService.getAll(),
          patientService.getAll(),
          doctorService.getAll()
        ]);
        setBillings(billingData);
        setPatients(patientData);
        setDoctors(doctorData);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      }
    };

    loadBillingData();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const getPatientName = useCallback(
    (patientId) => patients.find((patient) => patient.id === patientId)?.name || "Unknown Patient",
    [patients]
  );

  const getDoctorName = useCallback(
    (doctorId) => doctors.find((doctor) => doctor.id === doctorId)?.name || "Unknown Doctor",
    [doctors]
  );

  const filteredBillings = useMemo(() => {
    return billings.filter((billing) => {
      const matchesStatus = filters.paymentStatus
        ? billing.paymentStatus === filters.paymentStatus
        : true;
      const patientName = getPatientName(billing.patientId).toLowerCase();
      const matchesPatient = filters.patientSearch
        ? patientName.includes(filters.patientSearch.toLowerCase())
        : true;
      return matchesStatus && matchesPatient;
    });
  }, [billings, filters, getPatientName]);

  const summary = useMemo(() => {
    return filteredBillings.reduce(
      (acc, billing) => {
        acc.total += billing.amount;
        if (billing.paymentStatus === "PAID") {
          acc.paid += billing.amount;
          acc.paidCount += 1;
        } else {
          acc.unpaid += billing.amount;
          acc.unpaidCount += 1;
        }
        return acc;
      },
      { total: 0, paid: 0, unpaid: 0, paidCount: 0, unpaidCount: 0 }
    );
  }, [filteredBillings]);

  const columns = [
    { key: "appointmentId", header: "Appointment ID" },
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
      key: "amount",
      header: "Amount",
      render: (row) => `Rs. ${row.amount}`
    },
    { key: "billingDate", header: "Billing Date" },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (row) => (
        <span className={`status-pill ${row.paymentStatus === "PAID" ? "paid" : "unpaid"}`}>
          {row.paymentStatus}
        </span>
      )
    }
  ];

  if (!isAdmin()) {
    return <div className="empty-state">Only admin can access billing.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Billing</h2>
          <p>Review payment history, outstanding dues, and appointment-linked revenue.</p>
        </div>
      </div>

      {error && <div className="status-message error">{error}</div>}

      <div className="card-grid">
        <div className="stat-card">
          <h3>Total Billing</h3>
          <strong>{`Rs. ${summary.total}`}</strong>
        </div>
        <div className="stat-card">
          <h3>Paid Revenue</h3>
          <strong>{`Rs. ${summary.paid}`}</strong>
        </div>
        <div className="stat-card">
          <h3>Outstanding</h3>
          <strong>{`Rs. ${summary.unpaid}`}</strong>
        </div>
        <div className="stat-card">
          <h3>Payment Mix</h3>
          <strong>{`${summary.paidCount}/${summary.unpaidCount}`}</strong>
        </div>
      </div>

      <div className="panel">
        <h3>Filters</h3>
        <div className="form-grid">
          <FormInput
            label="Payment Status"
            name="paymentStatus"
            type="select"
            value={filters.paymentStatus}
            onChange={handleFilterChange}
            required={false}
            options={[
              { value: "PAID", label: "PAID" },
              { value: "UNPAID", label: "UNPAID" }
            ]}
          />
          <FormInput
            label="Patient Search"
            name="patientSearch"
            value={filters.patientSearch}
            onChange={handleFilterChange}
            required={false}
            placeholder="Search by patient name"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredBillings}
        emptyMessage="No billing records found."
      />
    </div>
  );
}

export default BillingPage;
