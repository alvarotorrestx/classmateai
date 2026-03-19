import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AuthLoading from "./AuthLoading";

const RedirectIfAuth = () => {
  const { auth, authLoading } = useAuth();

  if (authLoading) {
    return <AuthLoading />;
  }

  return auth?.user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default RedirectIfAuth;