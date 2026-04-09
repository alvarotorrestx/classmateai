import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";
import ThemeToggle from "../ui/ThemeToggle";

const InnerAppPageLayout = ({ children }) => {
    const { auth, setAuth } = useAuth();

    const fullName = auth?.user?.full_name || "Student";
    const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // ignore logout API errors; clear client state
        }
        setAuth(null);
        navigate("/");
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <section className="w-full flex items-center justify-center max-w-500 mx-auto">
            <div className="w-full bg-(--surface) overflow-hidden">
                {/* Header */}
                <header className="w-full bg-brand px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/logo/logo.png"
                            alt="ClassmateAI logo"
                            className="w-15 h-12 rounded-md bg-white p-1"
                        />
                        <Link to="/dashboard" className="text-(--surface-muted) font-medium flex items-center gap-2">
                            <span>←</span> Back to Dashboard
                        </Link>
                    </div>

                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="w-10 h-10 rounded-full bg-(--mint-400) flex items-center justify-center font-semibold text-(--mint-950) hover:bg-(--mint-300) transition cursor-pointer"
                            title="Account menu"
                        >
                            {initials}
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 min-w-40 rounded-xl border border-theme bg-surface shadow-lg py-2 z-50">
                                <ThemeToggle />
                                <button
                                    type="button"
                                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                                    className="w-full px-4 py-2 text-left text-sm font-medium text-base-theme hover:bg-surface-muted transition cursor-pointer"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content */}
                <div className="px-6 py-6">
                    {children}
                </div>
            </div>
        </section>
    );
};

export default InnerAppPageLayout;
