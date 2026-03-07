import MainAppPageLayout from "../../components/layout/MainAppPageLayout";
import useAuth from "../../hooks/useAuth";

const Dashboard = () => {
  const { auth } = useAuth();

  const fullName = auth?.user?.full_name || "Student";
  const firstName = fullName.split(" ")[0];

  const hour = new Date().getHours();

  let greeting = "Welcome Back";
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  const initials = fullName
    ? fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "CAI";

  return (
    <MainAppPageLayout
      headerTitle={`Welcome Back, ${firstName}!`}
      profileInitials={initials}
      title={`${greeting}, ${firstName}!`}
      subtitle=""
    >
    </MainAppPageLayout>
  );
};

export default Dashboard;