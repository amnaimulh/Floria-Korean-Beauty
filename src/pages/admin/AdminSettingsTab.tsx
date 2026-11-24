import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import type { AdminActivityLog, HomepageSettings, StoreSettings } from '../../types';

interface AdminSettingsTabProps {
  initialSettings: StoreSettings;
  initialHomepage: HomepageSettings;
  logs: AdminActivityLog[];
  onRefresh: () => Promise<void>;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  initialSettings,
  initialHomepage,
  logs,
  onRefresh,
}) => {
  const { adminToken, adminUser, refreshStorefront, notify } = useApp();
  const [subTab, setSubTab] = useState<'homepage' | 'store' | 'profile' | 'logs'>('homepage');

  const [homepage, setHomepage] = useState<HomepageSettings>(initialHomepage);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);

  const [adminName, setAdminName] = useState(adminUser?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUploadBanner = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'hero_image' | 'editorial_image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await apiRequest<{ url: string }>(
          '/api/admin/upload',
          { method: 'POST', body: JSON.stringify({ filename: file.name, dataUrl: reader.result }) },
          adminToken
        );
        setHomepage((p) => ({ ...p, [field]: res.url }));
        notify('Banner uploaded.', 'success');
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const saveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(
        '/api/admin/homepage',
        { method: 'PUT', body: JSON.stringify(homepage) },
        adminToken
      );
      notify('Homepage content updated on storefront.', 'success');
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save homepage.', 'error');
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(
        '/api/admin/settings',
        { method: 'PUT', body: JSON.stringify(settings) },
        adminToken
      );
      notify('Store settings and social links updated.', 'success');
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save settings.', 'error');
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(
        '/api/admin/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            full_name: adminName,
            current_password: currentPassword || undefined,
            new_password: newPassword || undefined,
          }),
        },
        adminToken
      );
      setCurrentPassword('');
      setNewPassword('');
      notify('Administrator profile updated.', 'success');
      await onRefresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update profile.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[#EAE6E3] pb-3">
        {(
          [
            { key: 'homepage', label: 'Homepage Editor' },
            { key: 'store', label: 'Store & Social Settings' },
            { key: 'profile', label: 'Admin Profile' },
            { key: 'logs', label: `Activity Log (${logs.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            className={`px-4 py-2 text-xs uppercase tracking-wider border ${
              subTab === tab.key
                ? 'bg-[#242424] text-white border-[#242424]'
                : 'bg-white text-[#242424] border-[#EAE6E3]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'homepage' && (
        <form onSubmit={saveHomepage} className="bg-white border border-[#EAE6E3] p-6 space-y-4 text-xs">
          <h2 className="font-serif text-2xl font-medium text-[#242424]">Homepage Content</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase tracking-wider mb-1">Hero Title (EN)</label>
              <input
                type="text"
                value={homepage.hero_title}
                onChange={(e) => setHomepage({ ...homepage, hero_title: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Hero Title (Bangla)</label>
              <input
                type="text"
                value={homepage.hero_title_bn}
                onChange={(e) => setHomepage({ ...homepage, hero_title_bn: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Hero Subtitle (EN)</label>
              <textarea
                rows={2}
                value={homepage.hero_subtitle}
                onChange={(e) => setHomepage({ ...homepage, hero_subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Hero Subtitle (Bangla)</label>
              <textarea
                rows={2}
                value={homepage.hero_subtitle_bn}
                onChange={(e) => setHomepage({ ...homepage, hero_subtitle_bn: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Hero Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={homepage.hero_image}
                  onChange={(e) => setHomepage({ ...homepage, hero_image: e.target.value })}
                  className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
                />
                <label className="inline-flex items-center gap-1 px-3 py-2 border border-[#EAE6E3] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadBanner(e, 'hero_image')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Editorial Banner Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={homepage.editorial_image}
                  onChange={(e) => setHomepage({ ...homepage, editorial_image: e.target.value })}
                  className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
                />
                <label className="inline-flex items-center gap-1 px-3 py-2 border border-[#EAE6E3] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadBanner(e, 'editorial_image')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Hero Primary CTA</label>
              <input
                type="text"
                value={homepage.hero_primary_cta}
                onChange={(e) => setHomepage({ ...homepage, hero_primary_cta: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Hero Secondary CTA</label>
              <input
                type="text"
                value={homepage.hero_secondary_cta}
                onChange={(e) => setHomepage({ ...homepage, hero_secondary_cta: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Editorial Heading</label>
              <input
                type="text"
                value={homepage.editorial_title}
                onChange={(e) => setHomepage({ ...homepage, editorial_title: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Newsletter Heading</label>
              <input
                type="text"
                value={homepage.newsletter_title}
                onChange={(e) => setHomepage({ ...homepage, newsletter_title: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#242424] text-white uppercase tracking-widest"
          >
            Save Homepage Changes
          </button>
        </form>
      )}

      {subTab === 'store' && (
        <form onSubmit={saveSettings} className="bg-white border border-[#EAE6E3] p-6 space-y-5 text-xs">
          <h2 className="font-serif text-2xl font-medium text-[#242424]">
            Store Details, Announcement Bar & Social Media
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase tracking-wider mb-1">Announcement Bar (EN)</label>
              <input
                type="text"
                value={settings.announcement_bar}
                onChange={(e) => setSettings({ ...settings, announcement_bar: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Announcement Bar (Bangla)</label>
              <input
                type="text"
                value={settings.announcement_bar_bn}
                onChange={(e) => setSettings({ ...settings, announcement_bar_bn: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Brand Name</label>
              <input
                type="text"
                value={settings.brand_name}
                onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">WhatsApp Display</label>
              <input
                type="text"
                value={settings.whatsapp_display}
                onChange={(e) => setSettings({ ...settings, whatsapp_display: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">WhatsApp International Digits</label>
              <input
                type="text"
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block uppercase tracking-wider mb-1">Business Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#EAE6E3] space-y-3">
            <h3 className="uppercase tracking-wider font-semibold text-[#242424]">
              Official Social Media Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(settings.social_links) as Array<keyof typeof settings.social_links>).map(
                (key) => (
                  <div key={key}>
                    <label className="block uppercase tracking-wider mb-1">{key}</label>
                    <input
                      type="url"
                      value={settings.social_links[key]}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          social_links: { ...settings.social_links, [key]: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
                    />
                  </div>
                )
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#EAE6E3] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase tracking-wider mb-1">Shipping Policy</label>
              <textarea
                rows={3}
                value={settings.shipping_policy}
                onChange={(e) => setSettings({ ...settings, shipping_policy: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1">Return & Refund Policy</label>
              <textarea
                rows={3}
                value={settings.return_policy}
                onChange={(e) => setSettings({ ...settings, return_policy: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-[#242424] text-white uppercase tracking-widest"
          >
            Save Store Settings
          </button>
        </form>
      )}

      {subTab === 'profile' && (
        <form onSubmit={saveProfile} className="bg-white border border-[#EAE6E3] p-6 max-w-lg space-y-4 text-xs">
          <h2 className="font-serif text-2xl font-medium text-[#242424]">Administrator Profile</h2>
          <div>
            <label className="block uppercase tracking-wider mb-1">Email</label>
            <input
              type="text"
              disabled
              value={adminUser?.email || ''}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-[#777777]"
            />
          </div>
          <div>
            <label className="block uppercase tracking-wider mb-1">Display Name</label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
          </div>
          <div>
            <label className="block uppercase tracking-wider mb-1">Current Password (for password change)</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
          </div>
          <div>
            <label className="block uppercase tracking-wider mb-1">New Password (min 8 chars)</label>
            <input
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#242424] text-white uppercase tracking-widest"
          >
            Update Profile
          </button>
        </form>
      )}

      {subTab === 'logs' && (
        <div className="bg-white border border-[#EAE6E3] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6E3] text-[#777777] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6E3]">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="py-2.5 px-4 tabular-nums text-[#777777]">
                    {l.created_at.slice(0, 19)}
                  </td>
                  <td className="py-2.5 px-4">{l.admin_email}</td>
                  <td className="py-2.5 px-4 font-mono">{l.action}</td>
                  <td className="py-2.5 px-4 text-[#777777]">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
