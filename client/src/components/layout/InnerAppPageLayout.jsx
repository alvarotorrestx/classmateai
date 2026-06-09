import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon";

import dashboardIcon from "../../assets/icons/navigation/dashboard.svg";
import courseIcon from "../../assets/icons/navigation/course.svg";
import flashcardIcon from "../../assets/icons/core/flashcard.svg";
import quizIcon from "../../assets/icons/core/quiz.svg";
import analyticsIcon from "../../assets/icons/study_tools/chart.svg";
import trophyIcon from "../../assets/icons/status_and_feedback/trophy.svg";

import useAuth from "../../hooks/useAuth";
import api from "../../services/api";
import ThemeToggle from "../ui/ThemeToggle";
import { useToast } from "../../context/ToastContext";
import { clearCache } from "../../utils/requestCache";
import { useTutorial } from "../../hooks/useTutorial";
import TutorialModal from "../ui/TutorialModal";

const NAV_LINKS = [
    { to: "/dashboard",  icon: dashboardIcon,  label: "Dashboard"  },
    { to: "/courses",    icon: courseIcon,      label: "Courses"    },
    { to: "/flashcards", icon: flashcardIcon,   label: "Flashcards" },
    { to: "/quizzes",    icon: quizIcon,        label: "Quizzes"    },
    { to: "/analytics",  icon: analyticsIcon,   label: "Analytics"  },
    { to: "/rewards",    icon: trophyIcon,      label: "Rewards"    },
];

const InnerAppPageLayout = ({ children, headerTitle = "ClassmateAI" }) => {
    const { auth, setAuth } = useAuth();
    const { tutorialOpen, dismissTutorial, reopenTutorial } = useTutorial();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const fullName = auth?.user?.full_name || "Student";
    const profileAvatarUrl = auth?.user?.avatar_url || null;
    const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const [menuOpen, setMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // ignore logout API errors; clear client state anyway
        }
        clearCache();
        addToast("Logged out", "info");
        setAuth(null);
        navigate("/");
    };

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 transition font-medium ${
            isActive
                ? "bg-(--mint-100) text-(--mint-900)"
                : "text-(--text) hover:bg-(--mint-50) hover:text-(--mint-900)"
        }`;

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Lock scroll + close on Escape when mobile sidebar is open
    useEffect(() => {
        if (!sidebarOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setSidebarOpen(false);
        };
        document.addEventListener("keydown", handleKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [sidebarOpen]);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <>
        <section className="w-full flex items-center justify-center max-w-500 mx-auto">
            <div className="w-full bg-(--surface) overflow-hidden">

                {/* ── Header ── */}
                <header className="w-full bg-(--brand) px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Hamburger — mobile only */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden w-10 h-10 rounded-lg bg-(--mint-400) flex items-center justify-center text-(--mint-950) hover:bg-(--mint-300) transition cursor-pointer"
                            aria-label="Open navigation menu"
                            title="Menu"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>

                        <img
                            src="/images/logo/logo.png"
                            alt="ClassmateAI logo"
                            className="w-15 h-12 rounded-md bg-white p-1"
                        />

                        <span className="text-(--surface-muted) font-semibold truncate body-large">
                            {headerTitle}
                        </span>
                    </div>

                    {/* Profile / account menu */}
                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="w-10 h-10 rounded-full bg-(--mint-400) flex items-center justify-center font-semibold text-(--mint-950) hover:bg-(--mint-300) transition cursor-pointer overflow-hidden"
                            title="Account menu"
                        >
                            {profileAvatarUrl ? (
                                <img src={profileAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 min-w-40 rounded-xl border border-theme bg-surface shadow-lg py-2 z-50">
                                <ThemeToggle />
                                <button
                                    type="button"
                                    onClick={() => { setMenuOpen(false); reopenTutorial(); }}
                                    className="w-full px-4 py-2 text-left text-sm font-medium text-base-theme hover:bg-surface-muted transition cursor-pointer"
                                >
                                    How it works
                                </button>
                                <NavLink
                                    to="/settings/account"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-full block px-4 py-2 text-left text-sm font-medium text-base-theme hover:bg-surface-muted transition cursor-pointer"
                                >
                                    Account settings
                                </NavLink>
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

                {/* ── Main body ── */}
                <div className="flex min-h-[70vh]">

                    {/* Mobile sidebar overlay */}
                    {sidebarOpen && (
                        <div className="md:hidden fixed inset-0 z-40">
                            <button
                                type="button"
                                className="absolute inset-0 bg-black/30"
                                aria-label="Close navigation menu"
                                onClick={closeSidebar}
                            />
                            <aside className="absolute left-0 top-0 h-full w-[82vw] max-w-72 border-r border-theme bg-surface px-4 py-5 flex flex-col gap-2 shadow-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-(--text-emphasis)">Menu</span>
                                    <button
                                        type="button"
                                        onClick={closeSidebar}
                                        className="w-9 h-9 rounded-lg hover:bg-(--mint-50) transition flex items-center justify-center cursor-pointer"
                                        aria-label="Close navigation menu"
                                        title="Close"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                                {NAV_LINKS.map(({ to, icon, label }) => (
                                    <NavLink key={to} to={to} className={navLinkClass} onClick={closeSidebar}>
                                        <Icon src={icon} size={24} />
                                        <span>{label}</span>
                                    </NavLink>
                                ))}
                            </aside>
                        </div>
                    )}

                    {/* Desktop sidebar */}
                    <aside className="hidden md:flex w-56 border-r border-theme bg-surface px-4 py-5 flex-col gap-2">
                        {NAV_LINKS.map(({ to, icon, label }) => (
                            <NavLink key={to} to={to} className={navLinkClass}>
                                <Icon src={icon} size={24} />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </aside>

                    {/* Page content */}
                    <div className="flex-1 px-6 py-6">
                        {children}
                    </div>
                </div>

            </div>
        </section>
        {tutorialOpen && <TutorialModal onDismiss={dismissTutorial} />}
        </>
    );
};

export default InnerAppPageLayout;
