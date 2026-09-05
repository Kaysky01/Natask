import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Bell, CircleUserRound, Save, Upload, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { compressImage } from '../../utils/imageCompression';
import { handleApiError } from '../../api/client';

const timezones = ['UTC', 'Asia/Jakarta', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'America/New_York', 'America/Los_Angeles'];

export const AccountPage: React.FC = () => {
  const { user, updateProfile, updateAvatar } = useAuthStore();
  const { success, error: toastError } = useToast();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setBio(user.bio || '');
    setTimezone(user.timezone || 'UTC');
    setEmailNotifications(user.preferences?.email_notifications !== false);
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    setIsSaving(true);

    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim() || undefined,
        timezone,
        preferences: { email_notifications: emailNotifications },
      });
      success('Your account details have been updated.', 'Account saved');
    } catch (err: any) {
      const message = handleApiError(err);
      setFormError(message);
      toastError(message, 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith('image/')) {
      toastError('File yang dipilih harus berupa gambar (JPG, PNG, WebP).', 'Format tidak didukung');
      event.target.value = '';
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Auto compress high-res mobile photos to optimize upload speed & size
      const processedFile = await compressImage(file, 1024, 1024, 0.85);

      if (processedFile.size > 10 * 1024 * 1024) {
        toastError('Ukuran gambar maksimal 10 MB.', 'File terlalu besar');
        return;
      }

      await updateAvatar(processedFile);
      success('Foto profil berhasil diperbarui.', 'Avatar tersimpan');
    } catch (err: any) {
      toastError(handleApiError(err), 'Gagal mengunggah foto');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface" title="Back to dashboard">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Manage account</h1>
          <p className="text-sm text-muted">Update your profile and notification preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="p-3 rounded-xl border border-error/20 bg-error/10 text-error text-xs">
            {formError}
          </div>
        )}

        <section className="bg-surface border border-border rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <CircleUserRound className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-text">Profile</h2>
              <p className="text-xs text-muted">This information is visible to your teammates.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={name || user.name} src={user.avatar} size="lg" />
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Profile photo</p>
              <p className="text-xs text-muted">JPG, PNG, WebP, atau kamera HP (Maksimal 10 MB).</p>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              disabled={isUploadingAvatar}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className={`ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text bg-background border border-border rounded-lg hover:bg-surface cursor-pointer transition-colors ${
                isUploadingAvatar ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Upload photo
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Full name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Email address</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text">Bio</label>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={1000} rows={4} placeholder="Tell your team a little about yourself" className="w-full text-sm bg-background border border-border rounded-xl p-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <p className="text-[11px] text-muted text-right">{bio.length}/1000</p>
          </div>
        </section>

        <section className="bg-surface border border-border rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-text">Preferences</h2>
              <p className="text-xs text-muted">Choose how NaTask keeps you informed.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Timezone</label>
              <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
                {timezones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-3 text-sm text-text cursor-pointer pb-2">
              <input type="checkbox" checked={emailNotifications} onChange={(event) => setEmailNotifications(event.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              Receive email notifications
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isSaving} disabled={!name.trim() || !email.trim()}>
            <Save className="w-4 h-4 mr-1.5" />
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccountPage;
