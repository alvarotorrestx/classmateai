const SkeletonBlock = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`rounded-lg bg-gray-200/80 animate-pulse ${className}`}
    />
  );
};

export default SkeletonBlock;
