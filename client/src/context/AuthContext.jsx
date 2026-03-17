import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setLogoutHandler } from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const navigate = useNavigate();

  // Register a global logout handler for the Axios interceptor and other callers.
  useEffect(() => {
    setLogoutHandler(() => {
      setAuth(null);
      navigate("/login");
    });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};