import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import {
  roleOptions,
  specializationOptions
} from "../constants/specializations";
import {
  authService,
  getAuthToken,
  getErrorMessage,
  setAuthSession
} from "../services/api";

const initialState = {
  role: "PATIENT",
  name: "",
  email: "",
  username: "",
  password: "",
  age: "",
  gender: "",
  phone: "",
  disease: "",
  specialization: ""
};

function RegisterPage() {
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (getAuthToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await authService.register(formData);
      if (data.token) {
        setAuthSession(data.token, data.user);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p>Register a new hospital system user account.</p>

        {error && <div className="status-message error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <FormInput
            label="Role"
            name="role"
            type="select"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
          />
          <FormInput
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <FormInput
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />
          {formData.role === "DOCTOR" && (
            <>
              <FormInput
                label="Phone"
                name="phone"
                value={formData.phone}
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
            </>
          )}
          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="helper-text">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
