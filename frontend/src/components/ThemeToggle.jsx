import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      className="p-2 rounded-lg bg-white shadow hover:bg-gray-50 transition dark:bg-gray-700 dark:hover:bg-gray-600 text-lg"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}