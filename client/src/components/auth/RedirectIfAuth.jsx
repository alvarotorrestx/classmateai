import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const RedirectIfAuth = () => {
  const { auth } = useAuth();

  return auth?.user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default RedirectIfAuth;