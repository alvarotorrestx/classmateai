import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import useAuth from "../../hooks/useAuth";
import { getNotes } from "../../services/noteService";

const Dashboard = () => {
  const { auth } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fullName = auth?.user?.full_name || "Student";
  const firstName = fullName.split(" ")[0];

  const hour = new Date().getHours();
  let greeting = "Welcome back";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    getNotes()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainAppPageLayout
      headerTitle={`Welcome Back, ${firstName}!`}
      profileInitials={initials}
      title={`${greeting}, ${firstName}!`}
      subtitle="Ready to study? Pick up where you left off."
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xl font-bold">Your Courses</p>
        <Link
          to="/courses/new"
          className="border border-(--mint-600) text-(--mint-700) rounded-xl px-4 py-2 text-sm font-semibold hover:bg-(--mint-50) transition"
        >
          + New Course
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-(--mint-100) flex items-center justify-center mb-4">
            <svg
              width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="text-(--mint-600)"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <p className="font-bold text-base mb-1">No courses yet</p>
          <p className="text-sm text-gray-400 mb-5">
            Create your first course and upload your notes to get started
          </p>
          <Link
            to="/courses/new"
            className="bg-(--mint-600) text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-(--mint-700) transition"
          >
            + New Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition block"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-base leading-snug">{course.title}</p>
                <span className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold bg-(--mint-100) text-(--mint-800)">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(course.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </MainAppPageLayout>
  );
};

export default Dashboard;
