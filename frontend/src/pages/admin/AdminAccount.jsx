import React, { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { inputCls, btnPrimary } from '../../components/ui';

export default function AdminAccount() {
  const { user, applySession } = useAuth();
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Email is required so you can log in with it');
      return;
    }
    if (!String(email).includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    try {
      const { data } = await api.put('/auth/profile', {
        fullname,
        email,
        password: password || undefined
      });
      applySession(data.user, data.token);
      setPassword('');
      setSuccess('Account updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Network error');
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Account</h1>

      <div className="bg-white rounded-xl shadow p-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" className={inputCls} value={fullname} onChange={(e) => setFullname(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username (cannot change)</label>
            <input type="text" className={inputCls} value={user?.username || ''} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password <span className="text-gray-400">(leave blank to keep current)</span>
            </label>
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <button type="submit" className={btnPrimary}>Save Account</button>
        </form>
        <div className="mt-6 text-sm text-gray-500">
          You can now log in using your email <span className="font-medium text-gray-700">{user?.email || '(not set yet)'}</span> or your username.
        </div>
      </div>
    </div>
  );
}