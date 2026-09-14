
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);

      // Get logged-in user
      const user = data.user;

      // Show success message
      toast.success(`Welcome ${user.name || user.username || 'User'}!`);

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/auth/admin');
      } else if (user.role === 'cashier') {
        navigate('/auth/cashier');
      } else {
        toast.error('Unknown user role');
        navigate('/auth/login');
      }

    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Network error. Please try again.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithEmail = async (e) => {
    e.preventDefault();
    setError('');

    if (!String(username).includes('@')) {
      const message =
        'Enter your registered email address to continue with email login';

      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      const data = await login(username, password);

      // Get logged-in user
      const user = data.user;

      // Show success message
      toast.success(`Welcome ${user.name || user.username || 'User'}!`);

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/auth/admin');
      } else if (user.role === 'cashier') {
        navigate('/auth/cashier');
      } else {
        toast.error('Unknown user role');
        navigate('/auth/login');
      }

    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Network error. Please try again.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 px-4 py-8">

      <div className="absolute top-4 right-4">
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md dark:bg-gray-800">

        <div className="text-center mb-8">

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-3xl shadow-lg">
            💊
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            Stream Pharmacy
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Cashier &amp; Sales Management System
          </p>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email or Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="Enter email or username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="flex items-center gap-3 my-1">

            <div className="flex-1 h-px bg-gray-200"></div>

            <span className="text-xs text-gray-400">
              or continue with
            </span>

            <div className="flex-1 h-px bg-gray-200"></div>

          </div>

          <button
            type="button"
            onClick={handleContinueWithEmail}
            disabled={loading}
            className="w-full py-2.5 border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >

            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.15 0 8.66-3.6 8.66-8.66 0-.6-.05-1.03-.13-1.48h1.01V9.7h-6.1v1.72h3.82c-.48 2.35-2.39 3.74-4.68 3.74-2.82 0-4.82-2.24-4.82-5.08S9.27 5 12 5c1.35 0 2.58.5 3.49 1.34l1.28-1.28A6.66 6.66 0 0 0 12 2z" />
            </svg>

            Continue with Email

          </button>

          <p className="text-center text-xs text-gray-400">
            After logging in with your email, a notification is sent to that email.
          </p>

        </form>

      </div>

    </div>
  );
}

