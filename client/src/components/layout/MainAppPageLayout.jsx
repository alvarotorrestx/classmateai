import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon";

import dashboardIcon from "../../assets/icons/navigation/dashboard.svg";
import courseIcon from "../../assets/icons/navigation/course.svg";
import flashcardIcon from "../../assets/icons/core/flashcard.svg";
import quizIcon from "../../assets/icons/core/quiz.svg";
import analyticsIcon from "../../assets/icons/study_tools/chart.svg";

import useAuth from "../../hooks/useAuth";

const InnerPageLayout = ({
    headerTitle = "Welcome back!",
    profileInitials = "CAI",
    title,
    subtitle,
    children
}) => {
    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 transition font-medium ${isActive
            ? "bg-(--mint-100) text-(--mint-900)"
            : "text-(--text) hover:bg-(--mint-50)"
        }`;

    const navigate = useNavigate();
    const { setAuth } = useAuth();

    const handleLogout = () => {
        setAuth(null)
        localStorage.removeItem("auth")
        navigate("/")
    }

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
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

                        <span className="text-white font-semibold truncate body-large">
                            {headerTitle}
                        </span>
                    </div>

                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="w-10 h-10 rounded-full bg-(--mint-400) flex items-center justify-center font-semibold text-(--mint-950) hover:bg-(--mint-300) transition cursor-pointer"
                            title="Account menu"
                        >
                            {profileInitials}
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 min-w-36 rounded-xl border border-(--mint-100) bg-white shadow-lg py-2 z-50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-medium text-(--text) hover:bg-(--mint-50) transition cursor-pointer"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main body */}
                <div className="flex min-h-[70vh]">
                    {/* Sidebar */}
                    <aside className="hidden md:flex w-56 border-r border-(--mint-100) bg-white px-4 py-5 flex-col gap-2">
                        <NavLink to="/dashboard" className={navLinkClass}>
                            <Icon src={dashboardIcon} size={24} />
                            <span>Dashboard</span>
                        </NavLink>

                        <NavLink to="/dashboard" className={navLinkClass}>
                            <Icon src={courseIcon} size={24} />
                            <span>Courses</span>
                        </NavLink>

                        <NavLink to="/flashcards" className={navLinkClass}>
                            <Icon src={flashcardIcon} size={24} />
                            <span>Flashcards</span>
                        </NavLink>

                        <NavLink to="/quizzes" className={navLinkClass}>
                            <Icon src={quizIcon} size={24} />
                            <span>Quizzes</span>
                        </NavLink>

                        <NavLink to="/analytics" className={navLinkClass}>
                            <Icon src={analyticsIcon} size={24} />
                            <span>Analytics</span>
                        </NavLink>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 px-6 py-6">
                        {(title || subtitle) && (
                            <div className="mb-6">
                                {title && <h3>{title}</h3>}
                                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InnerPageLayout;