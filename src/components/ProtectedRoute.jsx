import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

/** Guards a route: requires auth, and optionally a specific role. */
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
