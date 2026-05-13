import { useState, useRef } from "react";
import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import Button from "../../components/ui/Button";
import useAuth from "../../hooks/useAuth";
import { requestEmailChange, updatePassword, updateProfile } from "../../services/accountService";

const MIN_PASSWORD_LEN = 10;
const AVATAR_SIZE = 150; // px — resize canvas output

/** Resize an image File to a square JPEG data URL via Canvas */
function resizeImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");

      // crop to square from centre
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const AccountSettings = () => {
  const { auth, setAuth } = useAuth();
  const currentEmail = auth?.user?.email || "";
  const fullName = auth?.user?.full_name || "Student";
  const currentAvatarUrl = auth?.user?.avatar_url || null;

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── Profile (name + avatar) ──────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [profileName, setProfileName] = useState(fullName);
  const [avatarPreview, setAvatarPreview] = useState(null); // local preview data URL
  const [avatarDataUrl, setAvatarDataUrl] = useState(undefined); // undefined = unchanged
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("Please select an image file.");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setAvatarPreview(dataUrl);
      setAvatarDataUrl(dataUrl);
      setProfileError("");
    } catch {
      setProfileError("Could not process image. Please try a different file.");
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarDataUrl(null); // explicit null = clear server-side
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");

    const trimmedName = profileName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setProfileError("Name must be between 2 and 100 characters.");
      return;
    }

    setProfileLoading(true);
    try {
      const payload = { full_name: trimmedName };
      if (avatarDataUrl !== undefined) payload.avatar_url = avatarDataUrl;

      const updatedUser = await updateProfile(payload);

      // Update auth context in-place so header + initials refresh immediately
      setAuth((prev) => ({ ...prev, user: { ...prev.user, ...updatedUser } }));
      setProfileMessage("Profile updated successfully.");
      setAvatarDataUrl(undefined); // reset "changed" flag
      setAvatarPreview(null);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setProfileError(detail || "Could not update profile. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Email change ─────────────────────────────────────────────────────────
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

  // ── Password change ──────────────────────────────────────────────────────
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

  // ── Derived display values ───────────────────────────────────────────────
  const displayAvatar = avatarPreview ?? currentAvatarUrl;

  return (
    <MainAppPageLayout
      headerTitle="Account settings"
      profileInitials={initials}
      profileAvatarUrl={displayAvatar}
      title="Account settings"
      subtitle="Manage your profile, email address, and password."
    >
      <div className="max-w-4xl flex flex-col gap-6">

        {/* Profile card */}
        <div className="bg-surface rounded-2xl border border-theme shadow-sm p-6 sm:p-8">
          <p className="font-bold text-base mb-5 text-em">Profile</p>

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
            {/* Avatar row */}
            <div className="flex items-center gap-5">
              {/* Preview circle */}
              <div className="relative shrink-0">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Profile avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-(--mint-300)"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-(--mint-400) flex items-center justify-center font-bold text-2xl text-(--mint-950) border-2 border-(--mint-300)">
                    {initials}
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  disabled={profileLoading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={profileLoading}
                  className="text-sm font-semibold text-(--mint-700) hover:text-(--mint-900) transition cursor-pointer"
                >
                  Upload photo
                </button>
                {(displayAvatar) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={profileLoading}
                    className="text-sm font-semibold text-error hover:opacity-75 transition cursor-pointer"
                  >
                    Remove photo
                  </button>
                )}
                <p className="text-xs text-muted">JPG, PNG, GIF · Resized to 150×150</p>
              </div>
            </div>

            {/* Name field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="profile_name" className="font-semibold text-(--mint-700)">
                Display name
              </label>
              <input
                id="profile_name"
                name="profile_name"
                type="text"
                autoComplete="name"
                className="w-full rounded-xl border border-theme bg-surface px-5 py-4 shadow-md outline-none transition focus:border-(--mint-400) focus:ring-2 focus:ring-(--mint-200)"
                placeholder="Your name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                disabled={profileLoading}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <Button type="submit" variant="primary" disabled={profileLoading}>
              {profileLoading ? "Saving…" : "Save profile"}
            </Button>

            {profileMessage && (
              <p className="text-sm font-semibold text-(--mint-700)">{profileMessage}</p>
            )}
            {profileError && (
              <p className="text-sm font-semibold text-error">{profileError}</p>
            )}
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email change card */}
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

          {/* Password change card */}
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
