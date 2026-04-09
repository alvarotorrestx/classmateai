const AuthLoading = () => {
  return (
    <div className="w-full flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-(--mint-600) border-t-transparent animate-spin" />
        <p className="text-sm text-muted">Checking session…</p>
      </div>
    </div>
  );
};

export default AuthLoading;

