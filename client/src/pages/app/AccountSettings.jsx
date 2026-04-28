import { useState } from "react";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import Button from "../../components/ui/Button";
import useAuth from "../../hooks/useAuth";
import { requestEmailChange, updatePassword } from "../../services/accountService";

const MIN_PASSWORD_LEN = 10;

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

  const handleEmailSubmit = async (e) => {
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

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMessage("");
    setPwError("");

    if (pwNew.length < MIN_PASSWORD_LEN) {
      setPwError(`New password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await updatePassword({
        current_password: pwCurrent,
        new_password: pwNew,
      });
      setPwMessage(res?.message || "Password updated successfully.");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setPwError(detail || "Could not update password. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <MainAppPageLayout
      headerTitle="Account settings"
      profileInitials={initials}
      title="Account settings"
      subtitle="Change your email address. You'll need to verify the new email before it replaces the current one."
    >
      <div className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface rounded-2xl border border-theme shadow-sm p-6 sm:p-8">
            <p className="font-bold text-base mb-5 text-em">Email Address</p>

            <div className="mb-6">
              <p className="text-sm text-muted mb-1">Current email</p>
              <p className="font-semibold text-em break-all">{currentEmail}</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
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

          <div className="bg-surface rounded-2xl border border-theme shadow-sm p-6 sm:p-8">
            <p className="font-bold text-base mb-5 text-em">Password</p>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="pw_current" className="font-semibold text-(--mint-700)">
                  Current password
                </label>
                <input
                  id="pw_current"
                  name="pw_current"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
                  placeholder="••••••••"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  disabled={pwLoading}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="pw_new" className="font-semibold text-(--mint-700)">
                  New password
                </label>
                <input
                  id="pw_new"
                  name="pw_new"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
                  placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  disabled={pwLoading}
                  required
                  minLength={MIN_PASSWORD_LEN}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="pw_confirm" className="font-semibold text-(--mint-700)">
                  Confirm new password
                </label>
                <input
                  id="pw_confirm"
                  name="pw_confirm"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
                  placeholder="Repeat new password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  disabled={pwLoading}
                  required
                  minLength={MIN_PASSWORD_LEN}
                />
              </div>

              <Button type="submit" variant="primary" disabled={pwLoading}>
                {pwLoading ? "Updating…" : "Update password"}
              </Button>

              {pwMessage ? (
                <p className="text-sm font-semibold text-(--mint-700)">{pwMessage}</p>
              ) : null}
              {pwError ? (
                <p className="text-sm font-semibold text-error">{pwError}</p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </MainAppPageLayout>
  );
};

export default AccountSettings;

