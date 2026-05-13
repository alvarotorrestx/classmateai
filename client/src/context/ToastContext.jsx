import { createContext, useCallback, useContext, useState } from "react";
import { ToastContainer } from "../components/ui/Toast";

const ToastContext = createContext(null);

let _nextId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "success") => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
