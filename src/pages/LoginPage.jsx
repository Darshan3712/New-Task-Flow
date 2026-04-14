import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLogIn, FiLoader } from 'react-icons/fi';

export default function LoginPage({ isSuperAdmin }) {
  const [role, setRole] = useState(isSuperAdmin ? 'superadmin' : 'admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // The unified backend checks credentials securely based on username
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="TaskFlow Logo" className="login-main-logo" />
        </div>

        {!isSuperAdmin && (
          <div className="role-tabs">
            <button
              className={`role-tab ${role === 'admin' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setRole('admin'); }}
            >
              Admin
            </button>
            <button
              className={`role-tab ${role === 'employee' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setRole('employee'); }}
            >
              Employee
            </button>
            <button
              className={`role-tab ${role === 'client' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setRole('client'); }}
            >
              Client
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isSuperAdmin ? 'Enter super admin username' : role === 'admin' ? 'Enter admin username' : role === 'client' ? 'Enter client username' : 'Enter username'}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <FiLoader size={18} className="spin" /> : <FiLogIn size={18} />}
            {loading ? 'Signing in...' : `Sign In as ${isSuperAdmin ? 'Super Admin' : role === 'admin' ? 'Admin' : role === 'client' ? 'Client' : 'Employee'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
