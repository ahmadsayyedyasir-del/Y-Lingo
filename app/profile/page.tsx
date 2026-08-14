// app/profile/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { profileEndpoints } from '@/lib/endpoints';
import { SkeletonProfile } from '@/components/ui/Skeleton';

interface UserProfile {
  id?: string;
  user_id?: string;
  full_name?: string;
  username?: string;
  email?: string;
  native_language?: string;
  learning_language?: string;
  level?: number;
  learning_style?: string;
  daily_goal?: number;
  bio?: string;
  avatar_url?: string | null;
}

interface ProfileFormData {
  fullName: string;
  username: string;
  native_language: string;
  learning_language: string;
  level: number;
  learning_style: string;
  daily_goal: number;
  bio: string;
}

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    username: '',
    native_language: '',
    learning_language: '',
    level: 1,
    learning_style: 'conversation-first',
    daily_goal: 10,
    bio: '',
  });

  // ============================================================
  // FETCH PROFILE
  // ============================================================
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await profileEndpoints.get();
        const data: UserProfile = response.data;

        setProfile(data);

        setFormData({
          fullName: user?.full_name || data.full_name || '',
          username: user?.username || data.username || '',
          native_language: data.native_language || '',
          learning_language: data.learning_language || '',
          level: data.level || 1,
          learning_style: data.learning_style || 'conversation-first',
          daily_goal: data.daily_goal || 10,
          bio: data.bio || '',
        });

        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url);
        } else {
          setAvatarPreview(null);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, isLoading, router]);

  // ============================================================
  // FORM CHANGE
  // ============================================================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'level' || name === 'daily_goal'
          ? Number(value)
          : value,
    }));
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        native_language: formData.native_language,
        learning_language: formData.learning_language,
        level: Number(formData.level),
        learning_style: formData.learning_style,
        daily_goal: Number(formData.daily_goal),
        bio: formData.bio,
      };

      console.log('📤 Sending profile update:', payload);

      // Update backend
      await profileEndpoints.update(payload);

      // Fetch the actual saved profile from backend.
      // This guarantees the UI displays server-confirmed data.
      const refreshed = await profileEndpoints.get();
      const updatedProfile: UserProfile = refreshed.data;

      setProfile(updatedProfile);

      setFormData({
        fullName:
          updatedProfile.full_name ||
          payload.fullName ||
          '',
        username:
          updatedProfile.username ||
          payload.username ||
          '',
        native_language:
          updatedProfile.native_language ||
          payload.native_language ||
          '',
        learning_language:
          updatedProfile.learning_language ||
          payload.learning_language ||
          '',
        level:
          updatedProfile.level ??
          payload.level ??
          1,
        learning_style:
          updatedProfile.learning_style ||
          payload.learning_style ||
          'conversation-first',
        daily_goal:
          updatedProfile.daily_goal ??
          payload.daily_goal ??
          10,
        bio:
          updatedProfile.bio ??
          payload.bio ??
          '',
      });

      if (updatedProfile.avatar_url) {
        setAvatarPreview(updatedProfile.avatar_url);
      }

      // Refresh auth user separately.
      // IMPORTANT:
      // The profile-fetch useEffect does NOT depend on `user`,
      // so this will not cause another profile reset/refetch cycle.
      try {
        await refreshUser();
      } catch (authRefreshError) {
        console.warn(
          'Profile saved, but auth user refresh failed:',
          authRefreshError
        );
      }

      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err: unknown) {
      console.error('❌ Update error:', err);

      const axiosError = err as {
        response?: {
          data?: {
            detail?: unknown;
          };
        };
      };

      const errorData = axiosError?.response?.data;
      const detail = errorData?.detail;

      if (Array.isArray(detail)) {
        const messages = detail
          .map((item: unknown) => {
            const validationError = item as {
              loc?: Array<string | number>;
              msg?: string;
            };

            return `${validationError.loc?.join('.') || 'field'}: ${
              validationError.msg || 'Invalid value'
            }`;
          })
          .join('; ');

        setError(`Validation error: ${messages}`);
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // AVATAR CLICK
  // ============================================================
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // ============================================================
  // AVATAR UPLOAD
  // ============================================================
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Reset input so selecting the same file again works.
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setError('');
    setSuccess('');

    // Create local preview immediately
    const reader = new FileReader();

    reader.onload = (event) => {
      const preview = event.target?.result;

      if (typeof preview === 'string') {
        setAvatarPreview(preview);
      }
    };

    reader.readAsDataURL(file);

    try {
      // Upload the file first. Some backend versions return only a success
      // message (and not avatar_url), so do NOT assume the upload response
      // contains the URL. We verify the saved profile with GET /profile.
      const response = await profileEndpoints.uploadAvatar(file);

      // Prefer an avatar URL returned directly by the upload endpoint.
      // If it is missing, fetch the profile because the backend may have
      // successfully saved the avatar without returning its URL.
      let newAvatarUrl: string | null =
        typeof response?.data?.avatar_url === 'string'
          ? response.data.avatar_url
          : null;

      if (!newAvatarUrl) {
        const refreshed = await profileEndpoints.get();
        const savedProfile: UserProfile = refreshed.data;
        newAvatarUrl = savedProfile.avatar_url || null;

        if (newAvatarUrl) {
          setProfile(savedProfile);
        }
      }

      // The upload endpoint may have returned success while the profile
      // response still does not contain an avatar URL. In that case, keep
      // the local preview and report the real problem instead of crashing.
      if (!newAvatarUrl) {
        throw new Error(
          'Avatar was uploaded, but the saved profile did not return an avatar URL. ' +
            'The backend upload endpoint must persist avatar_url.'
        );
      }

      // Update profile state with the server-confirmed URL.
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: newAvatarUrl,
            }
          : {
              avatar_url: newAvatarUrl,
            }
      );

      // Replace the temporary FileReader preview with the real server URL.
      setAvatarPreview(newAvatarUrl);

      // Refresh auth state only after the profile/avatar has been confirmed.
      // The profile-fetch effect intentionally does not depend on `user`, so
      // this refresh will not cause an unnecessary profile reset.
      try {
        await refreshUser();
      } catch (authRefreshError) {
        console.warn(
          'Avatar uploaded, but auth user refresh failed:',
          authRefreshError
        );
      }

      setSuccess('Avatar updated successfully!');
    } catch (err) {
      console.error('Avatar upload error:', err);

      setError('Failed to upload avatar.');

      // Restore previous server avatar if upload fails
      if (profile?.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      } else {
        setAvatarPreview(null);
      }
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <SkeletonProfile />
      </div>
    );
  }

  // ============================================================
  // AUTH CHECK
  // ============================================================
  if (!isAuthenticated || !user) {
    return null;
  }

  const levelNames = [
    'Beginner',
    'Intermediate',
    'Advanced',
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          👤 Profile
        </h1>

        <p className="text-gray-400 mb-6">
          Manage your personal information
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">

          {/* ====================================================
              AVATAR SECTION
          ==================================================== */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-800">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-4xl text-white overflow-hidden">

                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.full_name?.charAt(0) || 'U'
                )}

              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />

              {/* Upload button */}
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg"
                title="Upload avatar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">
                {user.full_name}
              </h2>

              <p className="text-gray-400">
                @{user.username}
              </p>

              <p className="text-gray-500 text-sm">
                {user.email}
              </p>
            </div>
          </div>

          {/* ====================================================
              EDIT MODE
          ==================================================== */}
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Native Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Native Language
                  </label>

                  <input
                    type="text"
                    name="native_language"
                    value={formData.native_language}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Learning Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Learning Language
                  </label>

                  <input
                    type="text"
                    name="learning_language"
                    value={formData.learning_language}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Level
                  </label>

                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Beginner</option>
                    <option value={2}>Intermediate</option>
                    <option value={3}>Advanced</option>
                  </select>
                </div>

                {/* Learning Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Learning Style
                  </label>

                  <select
                    name="learning_style"
                    value={formData.learning_style}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="conversation-first">
                      Conversation First
                    </option>

                    <option value="structured">
                      Structured Learning
                    </option>

                    <option value="mixed">
                      Mixed
                    </option>
                  </select>
                </div>

                {/* Daily Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Daily Goal (minutes)
                  </label>

                  <input
                    type="number"
                    name="daily_goal"
                    value={formData.daily_goal}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bio
                </label>

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);

                    if (profile) {
                      setFormData({
                        fullName:
                          user.full_name ||
                          profile.full_name ||
                          '',
                        username:
                          user.username ||
                          profile.username ||
                          '',
                        native_language:
                          profile.native_language || '',
                        learning_language:
                          profile.learning_language || '',
                        level:
                          profile.level || 1,
                        learning_style:
                          profile.learning_style ||
                          'conversation-first',
                        daily_goal:
                          profile.daily_goal || 10,
                        bio:
                          profile.bio || '',
                      });
                    }

                    setError('');
                    setSuccess('');
                  }}
                  className="px-6 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>

              </div>
            </form>
          ) : (

            /* ====================================================
               VIEW MODE
            ==================================================== */
            <div className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Full Name */}
                <div>
                  <p className="text-gray-400 text-sm">
                    Full Name
                  </p>

                  <p className="text-white font-medium">
                    {user.full_name}
                  </p>
                </div>

                {/* Username */}
                <div>
                  <p className="text-gray-400 text-sm">
                    Username
                  </p>

                  <p className="text-white font-medium">
                    {user.username}
                  </p>
                </div>

                {/* Native Language */}
                <div>
                  <p className="text-gray-400 text-sm">
                    Native Language
                  </p>

                  <p className="text-white font-medium">
                    {profile?.native_language || 'Not set'}
                  </p>
                </div>

                {/* Learning Language */}
                <div>
                  <p className="text-gray-400 text-sm">
                    Learning Language
                  </p>

                  <p className="text-white font-medium">
                    {profile?.learning_language || 'Not set'}
                  </p>
                </div>

                {/* Level */}
                <div>
                  <p className="text-gray-400 text-sm">
                    Level
                  </p>

                  <p className="text-white font-medium">
                    {levelNames[(profile?.level || 1) - 1]}
                  </p>
                </div>

                {/* Learning Style */}
                <div>
                  <p className="text-gray-400 text-sm">
                    Learning Style
                  </p>

                  <p className="text-white font-medium capitalize">
                    {profile?.learning_style?.replace('-', ' ') ||
                      'Not set'}
                  </p>
                </div>

                {/* Daily Goal */}
                <div>
                  <p className="text-gray-400 text-sm">
                    Daily Goal
                  </p>

                  <p className="text-white font-medium">
                    {profile?.daily_goal || 0} minutes
                  </p>
                </div>

              </div>

              {/* Bio */}
              <div>
                <p className="text-gray-400 text-sm">
                  Bio
                </p>

                <p className="text-white">
                  {profile?.bio || 'No bio yet.'}
                </p>
              </div>

              {/* Edit */}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setEditing(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}