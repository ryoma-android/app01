'use client'

import React, { useState, useEffect, Fragment } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // サーバーサイドレンダリングでは何も表示しない
    return <div className="w-10 h-10" />;
  }

  const renderIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5 text-gray-700" />;
      case 'dark':
        return <Moon className="w-5 h-5 text-gray-200" />;
      case 'system':
        return <Monitor className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          {renderIcon()}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-36 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:divide-gray-700 dark:ring-gray-600">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setTheme('light')}
                  className={`${
                    active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-200'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <Sun className="mr-2 h-5 w-5" aria-hidden="true" />
                  ライト
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setTheme('dark')}
                  className={`${
                    active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-200'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <Moon className="mr-2 h-5 w-5" aria-hidden="true" />
                  ダーク
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setTheme('system')}
                  className={`${
                    active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-200'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <Monitor className="mr-2 h-5 w-5" aria-hidden="true" />
                  システム
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ThemeSwitcher; 