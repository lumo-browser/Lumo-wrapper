/**
 * AccountModal — Login, signup, and account management
 */

import React, { useState } from 'react';
import { X, User, Mail, Lock, LogOut, Shield, Bell, ChevronRight, Check } from 'lucide-react';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  avatarInitial: string;
}

type AuthMode = 'login' | 'signup' | 'profile';

interface AccountModalProps {
  isOpen: boolean;
  currentUser: UserAccount | null;
  onClose: () => void;
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
}

export function AccountModal({ isOpen, currentUser, onClose, onLogin, onLogout }: AccountModalProps): React.ReactElement | null {
  const [mode, setMode] = useState<AuthMode>(currentUser ? 'profile' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    // Simulate auth (replace with real API call)
    await new Promise((r) => setTimeout(r, 800));

    const user: UserAccount = {
      id: `user-${Date.now()}`,
      email: email.trim(),
      name: mode === 'signup' ? name.trim() : email.split('@')[0],
      plan: 'free',
      avatarInitial: (mode === 'signup' ? name.trim() : email.split('@')[0])[0].toUpperCase(),
    };

    onLogin(user);
    setMode('profile');
    setIsLoading(false);
  };

  const handleLogout = () => {
    onLogout();
    setMode('login');
    setEmail('');
    setPassword('');
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">
            {mode === 'profile' ? 'Account' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile View */}
        {mode === 'profile' && currentUser && (
          <div className="p-5 space-y-4">
            {/* Avatar + Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                {currentUser.avatarInitial}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{currentUser.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-1
                  ${currentUser.plan === 'pro'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                  {currentUser.plan === 'pro' && <Check className="w-3 h-3" />}
                  {currentUser.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1 border-t border-gray-200 dark:border-gray-700 pt-4">
              {[
                { icon: User, label: 'Profile Settings' },
                { icon: Shield, label: 'Privacy & Security' },
                { icon: Bell, label: 'Notifications' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>

            {/* Upgrade (if free) */}
            {currentUser.plan === 'free' && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Upgrade to Pro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Unlock unlimited AI requests, history sync, and more.</p>
                <button className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                  View Plans
                </button>
              </div>
            )}

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium border border-red-200 dark:border-red-900/30"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Auth Form */}
        {(mode === 'login' || mode === 'signup') && (
          <form onSubmit={handleAuth} className="p-5 space-y-4">
            {mode === 'signup' && (
              <InputField
                icon={<User className="w-4 h-4" />}
                type="text"
                placeholder="Full name"
                value={name}
                onChange={setName}
              />
            )}
            <InputField
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
            />
            <InputField
              icon={<Lock className="w-4 h-4" />}
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
            />

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-xl transition-colors"
            >
              {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
      />
    </div>
  );
}
