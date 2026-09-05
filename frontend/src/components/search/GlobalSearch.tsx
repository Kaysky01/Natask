import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, X, ArrowRight } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import type { Project, Task } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  type: 'project' | 'task';
  id: number;
  title: string;
  subtitle?: string;
  href: string;
}

// ─── GlobalSearch ─────────────────────────────────────────────────────────────

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: projects } = useProjects();
  const { data: tasks } = useTasks({ assigned_to_me: false });

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();

    const projectResults: SearchResult[] = (projects || [])
      .filter((p: Project) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p: Project) => ({
        type: 'project' as const,
        id: p.id,
        title: p.name,
        subtitle: p.description?.slice(0, 60) || `Status: ${p.status}`,
        href: `/projects/${p.id}`,
      }));

    const taskResults: SearchResult[] = (tasks || [])
      .filter((t: Task) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .slice(0, 6)
      .map((t: Task) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: t.project?.name ? `In ${t.project.name}` : undefined,
        href: `/projects/${t.project_id}`,
      }));

    return [...projectResults, ...taskResults];
  }, [query, projects, tasks]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        navigate(results[activeIndex].href);
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, results, activeIndex, navigate, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            placeholder="Search tasks, projects..."
            className="flex-1 text-sm bg-transparent outline-none text-text placeholder:text-muted"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted hover:text-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono text-muted bg-background border border-border rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {query.length >= 2 && (
          <div className="max-h-[360px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="py-10 text-center">
                <Search className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                <p className="text-sm text-muted">No results for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Group header: projects */}
                {results.some((r) => r.type === 'project') && (
                  <>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-4 py-1.5">
                      Projects
                    </p>
                    {results.filter((r) => r.type === 'project').map((result) => {
                      const idx = results.indexOf(result);
                      return (
                        <button
                          key={`project-${result.id}`}
                          onClick={() => { navigate(result.href); onClose(); }}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                            ${activeIndex === idx ? 'bg-background' : 'hover:bg-background'}
                          `}
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FolderKanban className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-[11px] text-muted truncate">{result.subtitle}</p>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100" />
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Group header: tasks */}
                {results.some((r) => r.type === 'task') && (
                  <>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-4 py-1.5 mt-1 border-t border-border/60">
                      Tasks
                    </p>
                    {results.filter((r) => r.type === 'task').map((result) => {
                      const idx = results.indexOf(result);
                      return (
                        <button
                          key={`task-${result.id}`}
                          onClick={() => { navigate(result.href); onClose(); }}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                            ${activeIndex === idx ? 'bg-background' : 'hover:bg-background'}
                          `}
                        >
                          <div className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                            <CheckSquare className="w-3.5 h-3.5 text-muted" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-[11px] text-muted truncate">{result.subtitle}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty/tip state */}
        {query.length < 2 && (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-muted">Type at least 2 characters to search tasks and projects</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[11px] text-muted">
          <span><kbd className="font-mono bg-background border border-border rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-background border border-border rounded px-1">↵</kbd> open</span>
          <span><kbd className="font-mono bg-background border border-border rounded px-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Hook to wire up the keyboard shortcut ────────────────────────────────────

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
