import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminOverview from './AdminOverview';
import AdminCashiers from './AdminCashiers';
import AdminReports from './AdminReports';
import AdminPurchases from './AdminPurchases';
import AdminExpenses from './AdminExpenses';
import AdminCashouts from './AdminCashouts';
import AdminInsurance from './AdminInsurance';
import AdminInsuranceCompanies from './AdminInsuranceCompanies';
import AdminActivity from './AdminActivity';
import AdminAccount from './AdminAccount';
import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/ThemeToggle';

const navItems = [
  { to: '/admin', end: true, icon: '📊', label: 'Overview' },
  { to: '/admin/cashiers', icon: '👥', label: 'Cashiers' },
  { to: '/admin/reports', icon: '📋', label: 'Reports' },
  { to: '/admin/purchases', icon: '🛒', label: 'Purchases' },
  { to: '/admin/activity', icon: '📅', label: 'Daily Activity' },
  { to: '/admin/expenses', icon: '💸', label: 'Expenses' },
  { to: '/admin/cashouts', icon: '🏦', label: 'Cashouts' },
  { to: '/admin/insurance', icon: '🛡️', label: 'Insurance' },
  { to: '/admin/insurance-companies', icon: '🏥', label: 'Insurance Companies' },
  { to: '/admin/account', icon: '👤', label: 'My Account' }
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 max-w-[85vw] bg-gradient-to-b from-teal-800 to-teal-900 text-white flex flex-col shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-teal-700/50 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold truncate">💊 Stream Pharmacy</div>
            <div className="text-teal-200 text-sm mt-1">Admin Panel</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden shrink-0 p-2 rounded-lg hover:bg-teal-700 text-xl leading-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition text-sm ${
                  isActive ? 'bg-teal-600 text-white' : 'text-teal-100 hover:bg-teal-700'
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-teal-700/50">
          <div className="text-sm font-semibold truncate">{user?.fullname}</div>
          <div className="text-teal-200 text-xs mb-3 truncate">{user?.email || user?.username}</div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-auto">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-3 pb-3 border-b border-gray-200 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/60 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-lg leading-none"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">Admin Dashboard</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Welcome back, {user?.fullname || user?.username}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="cashiers" element={<AdminCashiers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="purchases" element={<AdminPurchases />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="expenses" element={<AdminExpenses />} />
            <Route path="cashouts" element={<AdminCashouts />} />
            <Route path="insurance" element={<AdminInsurance />} />
            <Route path="insurance-companies" element={<AdminInsuranceCompanies />} />
            <Route path="account" element={<AdminAccount />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}