import { useAuth } from "../context/AuthContext";
import Events from "./Events";
import Landing from "./Landing";

// "/" shows the landing page to visitors and the events list once logged in.
export default function Home() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Events /> : <Landing />;
}
