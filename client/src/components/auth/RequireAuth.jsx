import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AuthLoading from "./AuthLoading";

const RequireAuth = () => {
  const { auth, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <AuthLoading />;
  }

  return auth?.user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default RequireAuth;