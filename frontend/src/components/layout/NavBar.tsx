'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Users, BarChart3, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/providers';

const navItems = [
  { name: 'Tournaments', href: '/dashboard/tournaments', icon: Trophy },
  { name: 'Players', href: '/dashboard/players', icon: Users },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const { isConnected } = useSocket();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(user.name || '');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Trophy className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold text-primary">
                Padel Tournament
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-primary text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title={isConnected ? 'Connected to server' : 'Disconnected'}>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
            <span className="text-sm text-gray-700">{userName}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
