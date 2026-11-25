import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Items from './pages/Items.jsx';
import Eligibility from './pages/Eligibility.jsx';
import NewRequest from './pages/NewRequest.jsx';
import MyRequests from './pages/MyRequests.jsx';
import AdminPortal from './pages/AdminPortal.jsx';
import Help from './pages/Help.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/items" element={<Items />} />
        <Route path="/eligibility" element={<Eligibility />} />
        <Route path="/new-request" element={<NewRequest />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/help" element={<Help />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="MANAGER">
              <AdminPortal />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
