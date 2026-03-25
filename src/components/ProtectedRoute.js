import { Navigate } from "react-router-dom";
import { getAuthToken } from "../services/api";

function ProtectedRoute({ children }) {
  const isAuthenticated = Boolean(getAuthToken());

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
