import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import AuthLoading from "./AuthLoading";
import { getSafeRedirect } from "../../utils/redirects";

const RedirectIfAuth = () => {
  const { auth, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <AuthLoading />;
  }

  if (auth?.user) {
    const next = getSafeRedirect(location.search, "/dashboard");
    return <Navigate to={next} replace />;
  }

  return <Outlet />;
};

export default RedirectIfAuth;