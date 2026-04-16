import { Routes, Route } from "react-router-dom";

// Public pages
import Landing from "./pages/public/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";

// App pages (protected)
import Dashboard from "./pages/app/Dashboard";
import Courses from "./pages/app/Courses";
import NewCourse from "./pages/app/NewCourse";
import UploadNotes from "./pages/app/UploadNotes";
import Processing from "./pages/app/Processing";
import StudyMaterialsReady from "./pages/app/StudyMaterialsReady";
import AllFlashcards from "./pages/app/AllFlashcards";
import AllQuizzes from "./pages/app/AllQuizzes";
import AllCourses from "./pages/app/AllCourses";
import Flashcards from "./pages/app/Flashcards";
import Quizzes from "./pages/app/Quizzes";
import QuizSession from "./pages/app/QuizSession";
import Analytics from "./pages/app/Analytics";
import Rewards from "./pages/app/Rewards";

// Route guards
import RequireAuth from "./components/auth/RequireAuth";
import RedirectIfAuth from "./components/auth/RedirectIfAuth";

// Not found page
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>

      <Route element={<RedirectIfAuth />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<AllCourses />} />
        <Route path="/courses/new" element={<NewCourse />} />
        <Route path="/courses/:courseId" element={<Courses />} />
        <Route path="/courses/:courseId/upload" element={<UploadNotes />} />
        <Route path="/courses/:courseId/processing" element={<Processing />} />
        <Route path="/courses/:courseId/ready" element={<StudyMaterialsReady />} />
        <Route path="/flashcards" element={<AllFlashcards />} />
        <Route path="/flashcards/:deckId" element={<Flashcards />} />
        <Route path="/quizzes" element={<AllQuizzes />} />
        <Route path="/quizzes/:courseId" element={<Quizzes />} />
        <Route path="/quizzes/:courseId/session/:quizId" element={<QuizSession />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/rewards" element={<Rewards />} />
      </Route>

      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}
