import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  Send, 
  CheckSquare, 
  Users, 
  Layers, 
  Radio, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { 
  useFonnteSettings, 
  useUpdateFonnteSettings, 
  useCheckFonnteDevice, 
  useTestSendFonnte,
} from '../../hooks/useFonnte';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface ProjectFonnteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

export const ProjectFonnteModal: React.FC<ProjectFonnteModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { data: settings, isLoading } = useFonnteSettings(projectId);
  const updateSettings = useUpdateFonnteSettings(projectId);
  const checkDevice = useCheckFonnteDevice(projectId);
  const testSend = useTestSendFonnte(projectId);
  const { success, error: toastError } = useToast();

  const [isEnabled, setIsEnabled] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('https://api.fonnte.com/send');
  const [targetType, setTargetType] = useState<'group' | 'personal' | 'both'>('group');
  const [groupTarget, setGroupTarget] = useState('');
  
  // Triggers
  const [notifyTaskCreated, setNotifyTaskCreated] = useState(true);
  const [notifyTaskStatusChanged, setNotifyTaskStatusChanged] = useState(true);
  const [notifyTaskCommented, setNotifyTaskCommented] = useState(true);
  const [notifyMemberJoined, setNotifyMemberJoined] = useState(true);

  // Test send state
  const [testTarget, setTestTarget] = useState('');
  const [showTestBox, setShowTestBox] = useState(false);

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.is_enabled ?? false);
      setApiToken(settings.api_token || '');
      setApiEndpoint(settings.api_endpoint || 'https://api.fonnte.com/send');
      setTargetType(settings.target_type || 'group');
      setGroupTarget(settings.group_target || '');
      setNotifyTaskCreated(settings.notify_task_created ?? true);
      setNotifyTaskStatusChanged(settings.notify_task_status_changed ?? true);
      setNotifyTaskCommented(settings.notify_task_commented ?? true);
      setNotifyMemberJoined(settings.notify_member_joined ?? true);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        is_enabled: isEnabled,
        api_token: apiToken,
        api_endpoint: apiEndpoint,
        target_type: targetType,
        group_target: groupTarget,
        notify_task_created: notifyTaskCreated,
        notify_task_status_changed: notifyTaskStatusChanged,
        notify_task_commented: notifyTaskCommented,
        notify_member_joined: notifyMemberJoined,
      });
      success('Pengaturan WhatsApp Fonnte berhasil disimpan.', 'Tersimpan');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan pengaturan';
      toastError(msg, 'Error');
    }
  };

  const handleCheckDevice = async () => {
    if (!apiToken && !settings?.is_token_set) {
      toastError('Silakan masukkan API Token Fonnte terlebih dahulu', 'Token Kosong');
      return;
    }
    try {
      const res = await checkDevice.mutateAsync({
        api_token: apiToken || undefined,
        api_endpoint: apiEndpoint,
      });
      if (res.success) {
        success(`Device terhubung: ${res.sender_number || 'Aktif'}`, 'Koneksi Berhasil');
      } else {
        toastError(res.message || 'Device tidak terhubung', 'Gagal Terhubung');
      }
    } catch (err: any) {
      toastError(err?.message || 'Gagal mengecek status device', 'Error');
    }
  };

  const handleTestSend = async () => {
    if (!testTarget.trim()) {
      toastError('Masukkan nomor WhatsApp tujuan uji coba (contoh: 081234567890)', 'Nomor Kosong');
      return;
    }
    try {
      await testSend.mutateAsync(testTarget);
      success(`Pesan uji coba berhasil dikirim ke ${testTarget}!`, 'Tes Berhasil');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal mengirim pesan tes';
      toastError(msg, 'Gagal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-surface border border-border w-full max-w-2xl rounded-2xl p-6 space-y-6 shadow-2xl my-8">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text">Integrasi WhatsApp (Fonnte)</h2>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Owner Only
                </span>
              </div>
              <p className="text-xs text-muted">
                Kirim notifikasi otomatis ke WhatsApp tim untuk proyek <strong>{projectName}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted">Memuat pengaturan Fonnte...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            
            {/* Master Toggle & Live Status Banner */}
            <div className="p-4 rounded-xl border border-border bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-text flex items-center gap-2 cursor-pointer" onClick={() => setIsEnabled(!isEnabled)}>
                  <span>Aktifkan Notifikasi WhatsApp Otomatis</span>
                </label>
                <p className="text-[11px] text-muted">
                  Aktifkan untuk memancarkan pesan WhatsApp saat aktivitas proyek berlangsung.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Device Status Live Badge */}
            {settings?.sender_number && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>
                    Nomor Pengirim Terhubung: <strong>{settings.sender_number}</strong> ({settings.device_status || 'connected'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckDevice}
                  disabled={checkDevice.isPending}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${checkDevice.isPending ? 'animate-spin' : ''}`} />
                  Cek Ulang
                </button>
              </div>
            )}

            {/* API Credentials Configuration */}
            <div className="space-y-3.5 bg-surface p-4 rounded-xl border border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Kredensial Fonnte API Milik Owner
              </h3>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text">Fonnte API Token</label>
                  <span className="text-[10px] text-muted">Dapatkan dari dashboard.fonnte.com</span>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder={settings?.is_token_set ? '•••••••••••••••••••••••••••••••• (Tersimpan)' : 'Masukkan token akun Fonnte Anda'}
                    className="w-full text-xs bg-background border border-border rounded-xl p-2.5 pr-20 text-text font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="p-1 text-muted hover:text-text rounded"
                      title={showToken ? 'Sembunyikan Token' : 'Lihat Token'}
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckDevice}
                      disabled={checkDevice.isPending}
                      className="px-2 py-1 bg-background hover:bg-surface border border-border rounded-lg text-[10px] font-semibold text-text flex items-center gap-1"
                      title="Cek koneksi device"
                    >
                      <RefreshCw className={`w-3 h-3 ${checkDevice.isPending ? 'animate-spin' : ''}`} />
                      {checkDevice.isPending ? 'Cek...' : 'Cek'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text">API Endpoint URL</label>
                  <button
                    type="button"
                    onClick={() => setApiEndpoint('https://api.fonnte.com/send')}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Reset Default
                  </button>
                </div>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.fonnte.com/send"
                  className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Target Mode Configuration */}
            <div className="space-y-3 bg-surface p-4 rounded-xl border border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-primary" />
                Mode Target Pengiriman
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'group',
                    title: 'Grup WA Saja',
                    desc: 'Kirim ke 1 ID Grup WhatsApp Tim',
                    icon: Users,
                  },
                  {
                    id: 'personal',
                    title: 'Personal Member',
                    desc: 'Kirim japri ke No WA masing-masing member',
                    icon: Smartphone,
                  },
                  {
                    id: 'both',
                    title: 'Keduanya',
                    desc: 'Kirim ke grup tim + japri ke orang terkait',
                    icon: Layers,
                  },
                ].map((item) => {
                  const isSelected = targetType === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTargetType(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/5 text-text ring-1 ring-emerald-500'
                          : 'border-border bg-background/50 hover:bg-background text-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-muted'}`} />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-text' : 'text-muted'}`}>{item.title}</p>
                        <p className="text-[10px] text-muted leading-tight mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(targetType === 'group' || targetType === 'both') && (
                <div className="space-y-1 pt-2 animate-in fade-in duration-150">
                  <label className="text-xs font-semibold text-text flex items-center gap-1">
                    <span>Target ID Grup WhatsApp</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={groupTarget}
                    onChange={(e) => setGroupTarget(e.target.value)}
                    placeholder="Contoh: 120363028392819@g.us atau Nama Grup di Fonnte"
                    className="w-full text-xs bg-background border border-border rounded-xl p-2.5 text-text font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[10px] text-muted">
                    Pastikan bot nomor pengirim Fonnte sudah dimasukkan ke dalam grup WhatsApp ini.
                  </p>
                </div>
              )}
            </div>

            {/* Event Triggers (Pemicu Mandiri) */}
            <div className="space-y-3 bg-surface p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  Pilihan Pemicu Notifikasi (Event Triggers)
                </h3>
                <span className="text-[10px] text-muted">Centang pemicu yang diinginkan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'task_created',
                    label: 'Task Baru Dibuat / Ditugaskan',
                    desc: 'Kirim notifikasi saat task baru dibuat atau dibagikan ke member',
                    checked: notifyTaskCreated,
                    onChange: setNotifyTaskCreated,
                  },
                  {
                    id: 'status_changed',
                    label: 'Perubahan Status Task',
                    desc: 'Kirim notifikasi saat task digeser ke kolom status lain (misal: Done)',
                    checked: notifyTaskStatusChanged,
                    onChange: setNotifyTaskStatusChanged,
                  },
                  {
                    id: 'comment_added',
                    label: 'Komentar Baru di Task',
                    desc: 'Kirim notifikasi saat ada diskusi atau feedback baru di task',
                    checked: notifyTaskCommented,
                    onChange: setNotifyTaskCommented,
                  },
                  {
                    id: 'member_joined',
                    label: 'Anggota Baru Bergabung',
                    desc: 'Kirim notifikasi saat ada member baru join melalui link undangan',
                    checked: notifyMemberJoined,
                    onChange: setNotifyMemberJoined,
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                      item.checked
                        ? 'border-border bg-background'
                        : 'border-border/50 bg-background/30 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      className="mt-0.5 rounded border-border text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5 select-none">
                      <span className="text-xs font-semibold text-text block">{item.label}</span>
                      <span className="text-[10px] text-muted block leading-tight">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Test Send Section */}
            <div className="p-4 bg-background/50 border border-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-text">Uji Coba Pengiriman Pesan</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTestBox(!showTestBox)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {showTestBox ? 'Sembunyikan' : 'Buka Panel Tes'}
                </button>
              </div>

              {showTestBox && (
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={testTarget}
                    onChange={(e) => setTestTarget(e.target.value)}
                    placeholder="Nomor WA Tujuan (contoh: 081234567890)"
                    className="w-full sm:flex-1 text-xs bg-surface border border-border rounded-xl p-2.5 text-text font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleTestSend}
                    disabled={testSend.isPending || !testTarget.trim()}
                    className="w-full sm:w-auto shrink-0"
                  >
                    {testSend.isPending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1" />
                    )}
                    {testSend.isPending ? 'Mengirim...' : 'Kirim Pesan Tes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Tutup
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProjectFonnteModal;
