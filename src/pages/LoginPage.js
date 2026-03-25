import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import { roleOptions } from "../constants/specializations";
import {
  authService,
  getAuthToken,
  getErrorMessage,
  setAuthSession
} from "../services/api";

const initialState = {
  role: "PATIENT",
  username: "",
  password: ""
};

function LoginPage() {
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
      const data = await authService.login(formData);
      setAuthSession(data.token, data.user);
      navigate("/dashboard");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h2 className="auth-brand-title">HOSPITAL HUB</h2>

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
          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="helper-text">
          New user? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
