import BadgeCard from "./BadgeCard";

const BadgeGrid = ({ badges }) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((b) => (
        <BadgeCard key={b.id} badge={b} />
      ))}
    </div>
  );
};

export default BadgeGrid;

