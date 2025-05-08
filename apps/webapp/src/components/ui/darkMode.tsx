'use client';

import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Default to light mode

  useEffect(() => {
    const storedPreference = localStorage.getItem('theme');
    if (storedPreference === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
    >
      Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
    </button>
  );
}
