import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import DefaultPageLayout from "../../components/layout/DefaultPageLayout";
import Button from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";
import useAuth from "../../hooks/useAuth";
import { getSharePreview, importShare } from "../../services/shareService";

const SharedContent = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { auth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const isAuthed = Boolean(auth?.user);

  const title = useMemo(() => {
    if (!data?.title) return "Shared content";
    return data.title;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);
    getSharePreview(token)
      .then((d) => {
        if (cancelled) return;
        setData(d);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.detail || "This shared link is invalid or expired.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await importShare(token);
      addToast(res?.message || "Added to your account.");
      if (res?.note_id) {
        navigate(`/courses/${res.note_id}`);
      }
    } catch (err) {
      addToast(err?.response?.data?.detail || "Import failed. Please try again.", "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <DefaultPageLayout
      pageTitle="Shared Content"
      title="Shared Notes"
      subtitle="Preview shared notes and add them to your account."
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {loading ? (
          <div className="bg-surface rounded-2xl border border-theme shadow-sm p-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
              <p className="text-sm text-muted">Loading shared notes…</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-surface rounded-2xl border border-theme shadow-sm p-8">
            <p className="font-semibold text-error mb-2">{error}</p>
            <p className="text-sm text-muted mb-6">
              Ask the sender to generate a fresh share link.
            </p>
            <Link to="/">
              <Button variant="primary" className="w-full sm:w-auto sm:min-w-48">
                Back to Home
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-2xl border border-theme shadow-sm p-6 sm:p-8">
              <p className="font-bold text-base text-em mb-3">{title}</p>
              <pre className="text-sm text-base-theme leading-relaxed whitespace-pre-wrap font-sans">
                {data?.content || ""}
              </pre>
            </div>

            <div className="bg-surface rounded-2xl border border-theme shadow-sm p-6 sm:p-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-em mb-1">Add to your account</p>
                <p className="text-sm text-muted">
                  Importing will add this note to your account. You can generate flashcards, quizzes, and a study guide after importing.
                </p>
              </div>

              {isAuthed ? (
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full sm:w-auto sm:min-w-48"
                >
                  {importing ? "Importing…" : "Add to my account"}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" state={{ from: location }}>
                    <Button variant="primary" className="w-full sm:w-auto sm:min-w-32">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" state={{ from: location }}>
                    <Button variant="secondary" className="w-full sm:w-auto sm:min-w-32">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DefaultPageLayout>
  );
};

export default SharedContent;

