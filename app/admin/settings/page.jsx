'use client';

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/Topbar';
import { useToast } from '@/components/ui/Toast';
import { useSearchParams } from 'next/navigation';
import {
  Camera,
  Images,
  ArrowRight,
  Cloud,
  Unplug,
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

function AdminSettingsPageInner() {
  const [admin, setAdmin] = useState(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPw, setSavingPw] =
    useState(false);

  const [drive, setDrive] = useState(null);
  const [driveBusy, setDriveBusy] =
    useState(false);

  const fileRef = useRef(null);
  const showToast = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function load() {
      try {
        const [
          driveResponse,
          profileResponse,
        ] = await Promise.all([
          fetch('/api/admin/google-drive/status'),
          fetch('/api/admin/profile'),
        ]);

        const driveData =
          await driveResponse.json();

        const profileData =
          await profileResponse.json();

        setDrive(driveData);

        if (profileResponse.ok) {
          setAdmin(profileData.admin);
          setName(
            profileData.admin?.name || ''
          );
        }
      } catch {
        showToast(
          'Unable to load settings.',
          'error'
        );
      }
    }

    load();
  }, [showToast]);

  useEffect(() => {
    const state = searchParams.get('drive');

    if (state === 'connected') {
      showToast(
        'Google Drive connected successfully.',
        'success'
      );
    }

    if (state === 'error') {
      showToast(
        searchParams.get('message') ||
          'Could not connect Google Drive.',
        'error'
      );
    }
  }, [searchParams, showToast]);

  async function connectDrive() {
    setDriveBusy(true);

    try {
      const response = await fetch(
        '/api/admin/google-drive/connect'
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Google Drive is not configured.'
        );
      }

      window.location.href = data.url;
    } catch (error) {
      showToast(
        error.message ||
          'Unable to connect Google Drive.',
        'error'
      );

      setDriveBusy(false);
    }
  }

  async function disconnectDrive() {
    const confirmed = window.confirm(
      'Disconnect Google Drive from Pikture Factory? Existing project folder links will remain in your Drive, but the panel will no longer sync or download through it.'
    );

    if (!confirmed) return;

    setDriveBusy(true);

    try {
      const response = await fetch(
        '/api/admin/google-drive/disconnect',
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.error ||
            'Unable to disconnect Google Drive.'
        );
      }

      setDrive((current) => ({
        ...(current || {}),
        connected: false,
        accountEmail: '',
      }));

      showToast(
        'Google Drive disconnected.',
        'success'
      );
    } catch (error) {
      showToast(
        error.message ||
          'Unable to disconnect Google Drive.',
        'error'
      );
    } finally {
      setDriveBusy(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const data = await uploadToCloudinary(
        file,
        {
          folder:
            'pikture-factory/admin-avatars',
          onProgress: setUploadProgress,
        }
      );

      const response = await fetch(
        '/api/admin/profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            avatar: data.secure_url,
          }),
        }
      );

      const responseData =
        await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            'Could not update profile picture.'
        );
      }

      setAdmin((current) => ({
        ...current,
        avatar: data.secure_url,
      }));

      showToast(
        'Profile picture updated.',
        'success'
      );
    } catch (error) {
      showToast(
        error.message ||
          'Could not update profile picture.',
        'error'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);

      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  }

  async function saveProfile() {
    if (!name.trim()) {
      showToast(
        'Display name is required.',
        'error'
      );

      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch(
        '/api/admin/profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to update profile.'
        );
      }

      setAdmin((current) => ({
        ...current,
        name: name.trim(),
      }));

      showToast(
        'Profile updated.',
        'success'
      );
    } catch (error) {
      showToast(
        error.message ||
          'Unable to update profile.',
        'error'
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();

    if (
      pwForm.newPassword !==
      pwForm.confirm
    ) {
      showToast(
        'New passwords do not match.',
        'error'
      );

      return;
    }

    if (pwForm.newPassword.length < 6) {
      showToast(
        'New password must be at least 6 characters.',
        'error'
      );

      return;
    }

    setSavingPw(true);

    try {
      const response = await fetch(
        '/api/admin/password',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            currentPassword:
              pwForm.currentPassword,
            newPassword:
              pwForm.newPassword,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to change password.'
        );
      }

      showToast(
        'Password changed successfully.',
        'success'
      );

      setPwForm({
        currentPassword: '',
        newPassword: '',
        confirm: '',
      });
    } catch (error) {
      showToast(
        error.message ||
          'Unable to change password.',
        'error'
      );
    } finally {
      setSavingPw(false);
    }
  }

  if (!admin) {
    return (
      <div className="text-secondary">
        Loading...
      </div>
    );
  }

  return (
    <>
      <AdminTopbar
        title="Settings"
        subtitle="Manage your admin profile and security."
      />

      {/* Google Drive */}
      <div className="panel bg-primary text-white border-primary mb-6 overflow-hidden relative">
        <div className="absolute -right-12 -top-20 w-60 h-60 rounded-full bg-gold/15 blur-3xl" />

        <div className="relative flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-gold flex items-center justify-center">
              <Cloud size={22} />
            </div>

            <div>
              <span className="text-gold text-[10px] uppercase tracking-[.18em] font-semibold">
                Private delivery storage
              </span>

              <h3 className="font-head text-2xl mt-1">
                Google Drive workspace
              </h3>

              <p className="text-xs text-white/55 mt-1 max-w-xl">
                Connect the Pikture Factory storage
                account used for event RAW/EDITED files
                and private client delivery.
              </p>
            </div>
          </div>

          {drive?.connected ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-white/45 block">
                  Connected account
                </span>

                <b className="text-sm">
                  {drive.accountEmail ||
                    'Connected'}
                </b>
              </div>

              <button
                type="button"
                onClick={disconnectDrive}
                disabled={driveBusy}
                className="btn btn-outline btn-sm !border-white/25 !text-white hover:!bg-white hover:!text-primary disabled:opacity-60"
              >
                <Unplug size={13} />
                {driveBusy
                  ? 'Disconnecting…'
                  : 'Disconnect'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={connectDrive}
              disabled={
                driveBusy ||
                drive?.configured === false
              }
              className="btn btn-gold btn-sm disabled:opacity-60"
            >
              {driveBusy
                ? 'Connecting…'
                : 'Connect Google Drive'}
            </button>
          )}
        </div>

        {drive?.configured === false && (
          <p className="relative mt-4 text-[11px] text-amber-200">
            Add GOOGLE_DRIVE_CLIENT_ID and
            GOOGLE_DRIVE_CLIENT_SECRET to the
            server environment before connecting.
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="panel">
          <h3 className="text-lg font-head mb-5">
            Profile
          </h3>

          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <img
                src={
                  admin.avatar ||
                  'https://i.pravatar.cc/100?img=5'
                }
                alt=""
                className="w-20 h-20 rounded-full object-cover"
              />

              <button
                type="button"
                onClick={() =>
                  fileRef.current?.click()
                }
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-primary"
              >
                <Camera size={14} />
              </button>

              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <b className="block">
                {admin.email}
              </b>

              <span className="text-xs text-secondary">
                {uploading
                  ? `Uploading... ${uploadProgress}%`
                  : 'Click the camera icon to update your photo'}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="label">
                Display Name
              </label>

              <input
                className="input"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>

            <div>
              <label className="label">
                Email (username)
              </label>

              <input
                className="input opacity-60"
                value={admin.email}
                disabled
              />
            </div>

            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="btn btn-primary w-fit disabled:opacity-60"
            >
              {savingProfile
                ? 'Saving...'
                : 'Save Profile'}
            </button>
          </div>

          <Link
            href="/admin/vendor-gallery"
            className="mt-6 flex items-center justify-between border border-border rounded-xl p-4 hover:border-gold transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center">
                <Images size={18} />
              </div>

              <div>
                <b className="text-sm block">
                  Homepage Gallery
                </b>

                <span className="text-xs text-secondary">
                  Search every vendor's approved work
                  and pick what shows on the homepage.
                </span>
              </div>
            </div>

            <ArrowRight
              size={16}
              className="text-secondary"
            />
          </Link>
        </div>

        {/* Password */}
        <div className="panel">
          <h3 className="text-lg font-head mb-5">
            Change Password
          </h3>

          <form
            onSubmit={changePassword}
            className="grid gap-4"
          >
            <div>
              <label className="label">
                Current Password
              </label>

              <input
                required
                type="password"
                className="input"
                value={
                  pwForm.currentPassword
                }
                onChange={(event) =>
                  setPwForm({
                    ...pwForm,
                    currentPassword:
                      event.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                New Password
              </label>

              <input
                required
                type="password"
                minLength={6}
                className="input"
                value={
                  pwForm.newPassword
                }
                onChange={(event) =>
                  setPwForm({
                    ...pwForm,
                    newPassword:
                      event.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Confirm New Password
              </label>

              <input
                required
                type="password"
                minLength={6}
                className="input"
                value={pwForm.confirm}
                onChange={(event) =>
                  setPwForm({
                    ...pwForm,
                    confirm:
                      event.target.value,
                  })
                }
              />
            </div>

            <button
              type="submit"
              disabled={savingPw}
              className="btn btn-primary w-fit disabled:opacity-60"
            >
              {savingPw
                ? 'Updating...'
                : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="panel py-20 text-center text-secondary">
          Loading settings…
        </div>
      }
    >
      <AdminSettingsPageInner />
    </Suspense>
  );
}