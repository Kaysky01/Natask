import React, { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Link2, XCircle, ArrowRight } from 'lucide-react';
import { useAcceptProjectInvitation } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { handleApiError } from '../../api/client';

export const ProjectInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();
  const acceptInvitation = useAcceptProjectInvitation();
  const hasAccepted = useRef(false);

  useEffect(() => {
    if (token && isAuthenticated && !hasAccepted.current) {
      hasAccepted.current = true;
      acceptInvitation.mutate(token);
    }
  }, [token, isAuthenticated, acceptInvitation]);

  if (isLoading) {
    return <InvitationShell><p className="text-sm text-muted">Memeriksa undangan...</p></InvitationShell>;
  }

  if (!isAuthenticated) {
    return (
      <InvitationShell>
        <h1 className="text-lg font-bold text-text">Undangan Bergabung Proyek</h1>
        <p className="text-xs text-muted">Silakan masuk atau buat akun NaTask untuk menerima undangan ini.</p>
        <div className="pt-2">
          <Button onClick={() => {
            localStorage.setItem('pending_invite_token', token || '');
            navigate('/login');
          }} size="sm" className="w-full">
            Masuk / Buat Akun <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </InvitationShell>
    );
  }

  if (acceptInvitation.isPending) {
    return (
      <InvitationShell>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-text">Bergabung ke proyek...</p>
      </InvitationShell>
    );
  }

  if (acceptInvitation.isSuccess) {
    const project = acceptInvitation.data.project;
    const isAlreadyMember = acceptInvitation.data.already_member;

    return (
      <InvitationShell>
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h1 className="text-lg font-bold text-text">
          {isAlreadyMember ? 'Anda Sudah Menjadi Anggota' : 'Berhasil Bergabung!'}
        </h1>
        <p className="text-xs text-muted">
          {isAlreadyMember
            ? `Anda sudah memiliki akses ke proyek ${project.name} sebagai ${acceptInvitation.data.role}.`
            : `Selamat datang di proyek ${project.name}! Role Anda: ${acceptInvitation.data.role}.`}
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate(`/projects/${project.id}`)} size="sm" className="w-full">
            Buka Proyek Sekarang
          </Button>
        </div>
      </InvitationShell>
    );
  }

  const errorMessage = acceptInvitation.error
    ? handleApiError(acceptInvitation.error)
    : 'Link undangan ini mungkin sudah kadaluarsa, sudah digunakan, atau tidak valid.';

  return (
    <InvitationShell>
      <XCircle className="w-10 h-10 text-error mx-auto" />
      <h1 className="text-lg font-bold text-text">Undangan Tidak Tersedia</h1>
      <p className="text-xs text-muted leading-relaxed">{errorMessage}</p>
      <div className="pt-2 flex flex-col gap-2">
        <Link to="/projects" className="w-full">
          <Button variant="secondary" size="sm" className="w-full">Kembali ke Daftar Proyek</Button>
        </Link>
      </div>
    </InvitationShell>
  );
};

const InvitationShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 text-center space-y-3.5 shadow-sm">
      <Link2 className="w-6 h-6 text-primary mx-auto" />
      {children}
    </div>
  </div>
);

export default ProjectInvitationPage;