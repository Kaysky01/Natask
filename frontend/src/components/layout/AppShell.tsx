import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useProjects } from '../../hooks/useProjects';
import { Avatar } from '../ui/Avatar';
import { Logo, LogoIcon } from '../ui/Logo';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { data: projects } = useProjects();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-background text-text flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-md border-b border-border z-20 shrink-0 sticky top-0">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-base tracking-tight">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-background transition-colors"
            aria-label="Toggle Theme"
            title="Toggle Light/Dark"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-background transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-64 sm:w-60 bg-surface border-r border-border flex flex-col shadow-xl md:shadow-none
          transform transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 font-bold text-base tracking-tight group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LogoIcon className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-text block leading-tight font-black">
                Na<span className="text-primary">Task</span>
              </span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider leading-tight">Workspace</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">

          {/* MY SPACE */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 mb-1.5">My Space</p>
            {[
              { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
              { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
            ].map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                  ${isActive(path)
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted hover:text-text hover:bg-background'}
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive(path) ? 'text-primary' : 'text-muted'}`} />
                {label}
              </Link>
            ))}
          </div>

          {/* PROJECTS */}
          <div className="space-y-0.5">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="w-full flex items-center justify-between px-2 mb-1"
            >
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Projects</p>
              <div className="flex items-center gap-1">
                <Link
                  to="/projects"
                  onClick={(e) => e.stopPropagation()}
                  className="p-0.5 rounded text-muted hover:text-primary transition-colors"
                  title="All Projects"
                >
                  <FolderKanban className="w-3 h-3" />
                </Link>
                {projectsExpanded
                  ? <ChevronDown className="w-3 h-3 text-muted" />
                  : <ChevronRight className="w-3 h-3 text-muted" />
                }
              </div>
            </button>

            {projectsExpanded && (
              <div className="space-y-0.5">
                {/* All Projects link */}
                <Link
                  to="/projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                    ${location.pathname === '/projects'
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted hover:text-text hover:bg-background'}
                  `}
                >
                  <FolderKanban className="w-4 h-4 shrink-0" />
                  All Projects
                </Link>

                {/* Individual project links */}
                {projects?.slice(0, 8).map((project) => {
                  const href = `/projects/${project.id}`;
                  const active = location.pathname === href;
                  return (
                    <Link
                      key={project.id}
                      to={href}
                      onClick={() => setMobileMenuOpen(false)}
                      title={project.name}
                      className={`
                        flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors
                        ${active
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted hover:text-text hover:bg-background'}
                      `}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: active ? 'var(--color-primary)' :
                            project.status === 'active' ? '#22c55e' :
                            project.status === 'on_hold' ? '#f59e0b' : '#9ca3af'
                        }}
                      />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  );
                })}

                {/* If more projects exist */}
                {(projects?.length || 0) > 8 && (
                  <Link
                    to="/projects"
                    className="flex items-center gap-3 px-3 py-1.5 text-xs text-muted hover:text-primary transition-colors"
                  >
                    <span className="w-2 h-2" />
                    <span>+{(projects?.length || 0) - 8} more...</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Theme toggle row */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-muted">Theme</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-background transition-colors"
              title="Toggle Light/Dark"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <Link
            to="/settings/account"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive('/settings/account') ? 'bg-primary/10 text-primary' : 'text-muted hover:text-text hover:bg-background'
            }`}
          >
            <Settings className="w-4 h-4" />
            Manage account
          </Link>

          {/* User card */}
          {user && (
            <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-background border border-border/60">
              <div className="flex items-center gap-2 overflow-hidden">
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-text truncate">{user.name}</p>
                  <p className="text-[11px] text-muted truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors ml-1 shrink-0"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
};

export default AppShell;