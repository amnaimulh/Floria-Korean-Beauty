import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import type { UserSession } from '../../types';
import { BrandLogo } from '../../components/common/BrandLogo';
import { SEOHead } from '../../components/common/SEOHead';
import { ToastContainer } from '../../components/common/ToastContainer';

export const AdminLoginPage: React.FC = () => {
  const { adminToken, setAdminSession, notify } = useApp();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (adminToken) {
      navigate('/admin');
      return;
    }
    apiRequest<{ setupRequired: boolean; envOverrideActive: boolean }>('/api/admin/auth/status')
      .then((res) => setSetupRequired(res.setupRequired))
      .catch(() => setSetupRequired(false))
      .finally(() => setChecking(false));
  }, [adminToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = setupRequired ? '/api/admin/auth/setup' : '/api/admin/auth/login';
      const body = setupRequired
        ? { full_name: fullName, email, password }
        : { email, password };

      const res = await apiRequest<{ token: string; user: UserSession }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setAdminSession(res.user, res.token);
      notify(
        setupRequired
          ? 'Administrator account configured and signed in.'
          : 'Signed in to Floria Admin Dashboard.',
        'success'
      );
      navigate('/admin');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Authentication failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center px-4 py-12">
      <SEOHead title="Admin Portal | Floria Korean Beauty" />
      <div className="w-full max-w-md bg-white border border-[#EAE6E3] p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#EAE6E3] pb-5">
          <BrandLogo to="/" />
          <span className="text-xs uppercase tracking-[0.16em] text-[#777777]">Admin Portal</span>
        </div>

        {checking ? (
          <p className="text-sm text-[#777777] py-6 text-center">Checking administrator status...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start gap-3 pb-2">
              {setupRequired ? (
                <ShieldCheck className="w-5 h-5 text-[#D5A7A8] mt-0.5 shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-[#D5A7A8] mt-0.5 shrink-0" />
              )}
              <div>
                <h1 className="font-serif text-2xl font-medium text-[#242424]">
                  {setupRequired ? 'Initial Administrator Setup' : 'Administrator Sign In'}
                </h1>
                <p className="text-xs text-[#777777] mt-1">
                  {setupRequired
                    ? 'Claim the primary administrator account for Floria Korean Beauty. This one-time setup locks automatically once created.'
                    : 'Enter your administrator credentials to manage products, orders, and store settings.'}
                </p>
              </div>
            </div>

            {setupRequired && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Store Owner / Manager"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                Administrator Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@floriakoreanbeauty.com"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#242424] mb-1">
                {setupRequired ? 'Create Password (min 8 chars) *' : 'Password *'}
              </label>
              <input
                type="password"
                required
                minLength={setupRequired ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE6E3] text-sm focus:outline-none focus:border-[#242424]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#242424] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#3a3a3a] disabled:opacity-60"
            >
              {submitting
                ? 'Authenticating...'
                : setupRequired
                ? 'Create Admin Account'
                : 'Sign In to Dashboard'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#EAE6E3] text-center">
          <Link to="/" className="text-xs text-[#777777] hover:text-[#242424] underline">
            Return to Storefront
          </Link>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};
