import { createContext, useContext, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('wsms_user');
    return raw ? JSON.parse(raw) : null;
  });

  function persist(data) {
    localStorage.setItem('wsms_token', data.token);
    const u = {
      username: data.username,
      email: data.email,
      role: data.role,
      designation: data.designation,
      department: data.department,
      maxPurchaseValue: data.maxPurchaseValue,
    };
    localStorage.setItem('wsms_user', JSON.stringify(u));
    setUser(u);
  }

  async function login(username, password) {
    const { data } = await client.post('/auth/login', { username, password });
    persist(data);
  }

  async function register(payload) {
    const { data } = await client.post('/auth/register', payload);
    persist(data);
  }

  function logout() {
    localStorage.removeItem('wsms_token');
    localStorage.removeItem('wsms_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
