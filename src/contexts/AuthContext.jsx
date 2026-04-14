import { createContext, useContext, useState } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      name: payload.name,
      role: payload.role,
      designation: payload.designation,
      assignedServiceIds: payload.assignedServiceIds || [],
      projectId: payload.projectId || null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const token = localStorage.getItem('taskapp_token');
    return token ? decodeToken(token) : null;
  });

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      localStorage.setItem('taskapp_token', data.token);
      const user = decodeToken(data.token);
      setCurrentUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Invalid credentials.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('taskapp_token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
