import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setLogoutHandler } from "../services/api";

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

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await api.get("/auth/session");
        if (!isMounted) return;
        setAuth({ user: res.data.user });
      } catch {
        // No valid session; leave auth as null
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};