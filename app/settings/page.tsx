// app/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { settingsEndpoints } from '@/lib/endpoints';
import { useTheme } from '@/context/ThemeContext';
import { LoadingSpinner } from '@/components/ui/Skeleton';

interface SettingsData {
  id: string;
  user_id: string;
  ai_speed: string;
  ai_voice: string;
  grammar_correction: boolean;
  translation_enabled: boolean;
  email_notifications: boolean;
  daily_reminders: boolean;
  theme: string;
}

interface ValidationError {
  type: string;
  loc: string[];
  msg: string;
  input: unknown;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string | ValidationError[];
    };
  };
}

export default function SettingsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { setTheme } = useTheme();
  
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ai_speed: 'normal',
    ai_voice: 'female',
    grammar_correction: true,
    translation_enabled: true,
    email_notifications: false,
    daily_reminders: true,
    theme: 'dark',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsEndpoints.get();
        const data = response.data;
        setSettings(data);
        setFormData({
          ai_speed: data.ai_speed || 'normal',
          ai_voice: data.ai_voice || 'female',
          grammar_correction: data.grammar_correction !== undefined ? data.grammar_correction : true,
          translation_enabled: data.translation_enabled !== undefined ? data.translation_enabled : true,
          email_notifications: data.email_notifications || false,
          daily_reminders: data.daily_reminders !== undefined ? data.daily_reminders : true,
          theme: data.theme || 'dark',
        });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAuthenticated, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    // Clear previous errors when user changes something
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await settingsEndpoints.update(formData);
      setSuccess('Settings updated successfully!');

      // Apply theme immediately
      setTheme(formData.theme as 'dark' | 'light' | 'system');

      const refreshResponse = await settingsEndpoints.get();
      setSettings(refreshResponse.data);
      
    } catch (err) {
      const apiError = err as ApiError;
      const detail = apiError?.response?.data?.detail;
      
      if (Array.isArray(detail)) {
        setError(detail.map((d: ValidationError) => d.msg).join(', '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to update settings. Please check your inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">⚙️ Settings</h1>
        <p className="text-gray-400 mb-6">Manage your application preferences</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Settings */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🤖 AI Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">AI Speed</label>
                <select
                  name="ai_speed"
                  value={formData.ai_speed}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">AI Voice</label>
                <select
                  name="ai_voice"
                  value={formData.ai_voice}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>
          </div>

          {/* Learning Settings */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">📚 Learning Settings</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="grammar_correction"
                  checked={formData.grammar_correction}
                  onChange={handleChange}
                  className="w-5 h-5 accent-blue-600"
                  disabled={isSubmitting}
                />
                <span className="text-gray-300">Enable Grammar Correction</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="translation_enabled"
                  checked={formData.translation_enabled}
                  onChange={handleChange}
                  className="w-5 h-5 accent-blue-600"
                  disabled={isSubmitting}
                />
                <span className="text-gray-300">Enable Translation</span>
              </label>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🔔 Notifications</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={formData.email_notifications}
                  onChange={handleChange}
                  className="w-5 h-5 accent-blue-600"
                  disabled={isSubmitting}
                />
                <span className="text-gray-300">Email Notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="daily_reminders"
                  checked={formData.daily_reminders}
                  onChange={handleChange}
                  className="w-5 h-5 accent-blue-600"
                  disabled={isSubmitting}
                />
                <span className="text-gray-300">Daily Reminders</span>
              </label>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🎨 Appearance</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
              <select
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}