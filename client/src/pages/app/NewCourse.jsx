import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InnerAppPageLayout from "../../components/layout/InnerAppPageLayout";

const NewCourse = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    const title = code.trim() ? `${name.trim()} - ${code.trim()}` : name.trim();
    navigate("/courses/new/upload", { state: { title } });
  };

  return (
    <InnerAppPageLayout headerTitle="Create Course">
      <div className="max-w-lg mx-auto text-center">
        <h3 className="mb-2">Create New Course</h3>
        <p className="text-sm text-muted mb-8">
          Add a course to start generating study materials
        </p>

        <form onSubmit={handleCreate} className="text-left flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-(--mint-700) text-sm">Course Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-sm outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-(--mint-700) text-sm">
              Course Code (Optional)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CS 401"
              className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-sm outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
            />
          </div>

          <div className="flex justify-center gap-4 mt-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="border border-(--mint-600) text-(--mint-700) rounded-xl px-8 py-3 font-semibold text-sm hover:bg-(--mint-50) transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-(--mint-600) text-white rounded-xl px-8 py-3 font-semibold text-sm hover:bg-(--mint-700) transition"
            >
              Next: Upload Notes →
            </button>
          </div>
        </form>
      </div>
    </InnerAppPageLayout>
  );
};

export default NewCourse;
