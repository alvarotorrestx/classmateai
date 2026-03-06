import { Routes, Route, Navigate } from "react-router-dom";

// Public pages
import Landing from "./pages/public/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// App pages (protected)
import Dashboard from "./pages/app/Dashboard";
// import Courses from "./pages/app/Courses";
// import Flashcards from "./pages/app/Flashcards";
// import Quizzes from "./pages/app/Quizzes";
// import Analytics from "./pages/app/Analytics";
// import Settings from "./pages/app/Settings";

// 404 page
// import NotFound from "./pages/NotFound";

// Route guards
// import RequireAuth from "./components/auth/RequireAuth";
// import PersistLogin from "./components/auth/PersistLogin";
// import RedirectIfAuth from "./components/auth/RedirectIfAuth";

export default function App() {
  return (
    <Routes>

      {/* Public Pages - Temporary */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/*
      <Route element={<RedirectIfAuth />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      */}

      {/*
      <Route element={<PersistLogin />}>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>
      */}

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}