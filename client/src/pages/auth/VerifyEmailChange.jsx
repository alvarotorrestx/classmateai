import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import DefaultPageLayout from "../../components/layout/DefaultPageLayout";
import Button from "../../components/ui/Button";
import useAuth from "../../hooks/useAuth";
import { fetchSession, verifyEmailChange } from "../../services/accountService";

const VerifyEmailChange = () => {
  const [params] = useSearchParams();
  const token = params.get("token");

  const { setAuth } = useAuth();
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    setStatus("loading");
    setMessage("");

    (async () => {
      try {
        const res = await verifyEmailChange(token);
        setStatus("success");
        setMessage(res?.message || "Email updated successfully.");

        // Refresh session so auth context reflects the new email
        try {
          const session = await fetchSession();
          if (session?.user) setAuth({ user: session.user });
        } catch {
          // ignore if not logged in / no session
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err?.response?.data?.detail ||
            "Verification failed. The link may be invalid or expired."
        );
      }
    })();
  }, [token, setAuth]);

  return (
    <DefaultPageLayout
      pageTitle="Verify Email Change"
      title="Confirm your new email"
      subtitle="We’ll update your account email after this confirmation."
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {status === "loading" ? (
          <div className="bg-surface rounded-2xl border border-theme shadow-sm p-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
              <p className="text-sm text-muted">Verifying…</p>
            </div>
          </div>
        ) : status === "success" ? (
          <div className="bg-surface rounded-2xl border border-theme shadow-sm p-8">
            <p className="font-semibold text-(--mint-700) mb-2">{message}</p>
            <p className="text-sm text-muted mb-6">
              You can continue using ClassmateAI with your updated email.
            </p>
            <Link to="/dashboard">
              <Button variant="primary" className="w-full sm:w-auto sm:min-w-48">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-theme shadow-sm p-8">
            <p className="font-semibold text-error mb-2">{message}</p>
            <p className="text-sm text-muted mb-6">
              If you requested another email change, use the most recent link you received.
            </p>
            <Link to="/dashboard">
              <Button variant="primary" className="w-full sm:w-auto sm:min-w-48">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DefaultPageLayout>
  );
};

export default VerifyEmailChange;

