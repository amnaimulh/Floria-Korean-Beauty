import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type { UserSession } from '../types';
import { SEOHead } from '../components/common/SEOHead';

export const CustomerLoginPage: React.FC = () => {
  const { setCustomerSession, notify } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: UserSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setCustomerSession(res.user, res.token);
      notify(`Welcome back, ${res.user.full_name}.`, 'success');
      navigate('/account');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Sign in failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, phone, new_password: newPassword }),
      });
      notify(res.message, 'success');
      setMode('login');
      setPassword('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Customer Sign In | Floria Korean Beauty" />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="border border-[#EAE6E3] bg-[#FAF8F5] p-8 space-y-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#777777]">Customer Account</p>
            <h1 className="mt-1 font-serif text-3xl font-medium text-[#242424]">
              {mode === 'login' ? 'Sign In' : 'Reset Password'}
            </h1>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a] disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-[#777777] hover:text-[#242424] underline"
                >
                  Forgot password?
                </button>
                <Link to="/register" className="text-[#242424] font-medium underline">
                  Create Account
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-[#777777] hover:text-[#242424] underline"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export const CustomerRegisterPage: React.FC = () => {
  const { setCustomerSession, notify } = useApp();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: UserSession }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, email, phone, password }),
      });
      setCustomerSession(res.user, res.token);
      notify('Account created successfully.', 'success');
      navigate('/account');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Create Account | Floria Korean Beauty" />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="border border-[#EAE6E3] bg-[#FAF8F5] p-8 space-y-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#777777]">Join Floria</p>
            <h1 className="mt-1 font-serif text-3xl font-medium text-[#242424]">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                Mobile Number (Bangladesh)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                Password (min 6 characters) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium"
            >
              {loading ? 'Creating...' : 'Register'}
            </button>
            <p className="text-xs text-center text-[#777777]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#242424] underline font-medium">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};
