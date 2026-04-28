import { useState } from "react";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import Button from "../../components/ui/Button";
import useAuth from "../../hooks/useAuth";
import { requestEmailChange } from "../../services/accountService";

const AccountSettings = () => {
  const { auth } = useAuth();
  const currentEmail = auth?.user?.email || "";
  const fullName = auth?.user?.full_name || "Student";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await requestEmailChange({
        new_email: newEmail,
        current_password: currentPassword,
      });
      setMessage(res?.message || "Check your new email to confirm this change.");
      setCurrentPassword("");
      setNewEmail("");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Could not request email change. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainAppPageLayout
      headerTitle="Account settings"
      profileInitials={initials}
      title="Account settings"
      subtitle="Change your email address. You'll need to verify the new email before it replaces the current one."
    >
      <div className="max-w-2xl">
        <div className="bg-surface rounded-2xl border border-theme shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm text-muted mb-1">Current email</p>
            <p className="font-semibold text-em break-all">{currentEmail}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="new_email" className="font-semibold text-(--mint-700)">
                New email
              </label>
              <input
                id="new_email"
                name="new_email"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
                placeholder="new@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="current_password" className="font-semibold text-(--mint-700)">
                Current password
              </label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Sending…" : "Send verification to new email"}
            </Button>

            {message ? (
              <p className="text-sm font-semibold text-(--mint-700)">{message}</p>
            ) : null}
            {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
          </form>
        </div>
      </div>
    </MainAppPageLayout>
  );
};

export default AccountSettings;

