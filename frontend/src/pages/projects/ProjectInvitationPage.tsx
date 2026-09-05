import React, { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Link2, XCircle } from 'lucide-react';
import { useAcceptProjectInvitation } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';

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
    return <InvitationShell><p className="text-sm text-muted">Loading invitation...</p></InvitationShell>;
  }

  if (!isAuthenticated) {
    return (
      <InvitationShell>
        <h1 className="text-lg font-bold text-text">You have been invited</h1>
        <p className="text-xs text-muted">Sign in or create an account to join this project.</p>
        <Button onClick={() => {
          localStorage.setItem('pending_invite_token', token || '');
          navigate('/login');
        }} size="sm">Continue to Login</Button>
      </InvitationShell>
    );
  }

  if (acceptInvitation.isPending) {
    return <InvitationShell><p className="text-sm text-muted">Joining project...</p></InvitationShell>;
  }

  if (acceptInvitation.isSuccess) {
    const project = acceptInvitation.data.project;
    return (
      <InvitationShell>
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h1 className="text-lg font-bold text-text">You joined {project.name}</h1>
        <p className="text-xs text-muted">Your role is {acceptInvitation.data.role}.</p>
        <Button onClick={() => navigate(`/projects/${project.id}`)} size="sm">Open Project</Button>
      </InvitationShell>
    );
  }

  return (
    <InvitationShell>
      <XCircle className="w-10 h-10 text-error mx-auto" />
      <h1 className="text-lg font-bold text-text">Invitation unavailable</h1>
      <p className="text-xs text-muted">This link may be expired, already used, or invalid.</p>
      <Link to="/projects"><Button variant="secondary" size="sm">Back to Projects</Button></Link>
    </InvitationShell>
  );
};

const InvitationShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 text-center space-y-3 shadow-sm">
      <Link2 className="w-6 h-6 text-primary mx-auto" />
      {children}
    </div>
  </div>
);

export default ProjectInvitationPage;