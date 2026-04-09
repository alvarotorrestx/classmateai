import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import DefaultPageLayout from "../../components/layout/DefaultPageLayout";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import { resendVerification } from "../../services/authService";
import { useToast } from "../../context/ToastContext";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token");

  const { addToast } = useToast();
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    setStatus("loading");
    setMessage("");

    api
      .post("/auth/verify-email", { token })
      .then((res) => {
        setStatus("success");
        setMessage(res?.data?.message || "Email verified successfully.");
        addToast("Email verified! You can now log in.")
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err?.response?.data?.detail ||
            "Verification failed. The link may be invalid or expired."
        );
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendMessage("");
    setResendLoading(true);
    try {
      const res = await resendVerification(email);
      setResendMessage(
        res?.message || "If an account exists, a verification email has been sent."
      );
      addToast("Verification email sent", "info");
    } catch {
      setResendMessage("If an account exists, a verification email has been sent.");
      addToast("Verification email sent", "info");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <DefaultPageLayout
      pageTitle="Verify Email"
      title="Verify your email"
      subtitle="Confirm your email address to finish setting up your account."
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
              You can now sign in to ClassmateAI.
            </p>
            <Link to="/login">
              <Button variant="primary" className="w-full sm:w-auto sm:min-w-48">
                Go to Login
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-theme shadow-sm p-8">
            <p className="font-semibold text-error mb-2">{message}</p>
            <p className="text-sm text-muted mb-6">
              If your link expired, you can request a new verification email.
            </p>

            <form onSubmit={handleResend} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-semibold text-(--mint-700)">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@email.com"
                  className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resendLoading}
                />
              </div>

              <Button type="submit" variant="primary" disabled={resendLoading}>
                {resendLoading ? "Sending..." : "Resend verification email"}
              </Button>

              {resendMessage && (
                <p className="text-sm text-muted">{resendMessage}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </DefaultPageLayout>
  );
};

export default VerifyEmail;

