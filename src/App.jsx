import useLocalStorage from "./hooks/useLocalStorage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useLocalStorage("zp_user", null);

  const handleLogout = () => {
    localStorage.removeItem("zp_license");
    localStorage.removeItem("zp_user");
    setUser(null);
  };

  // Migration: old string-based user → force logout
  if (user && typeof user === "string") {
    handleLogout();
    return null;
  }

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
