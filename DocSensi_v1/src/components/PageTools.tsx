import React, { useMemo, useState } from 'react';
import { Bookmark, BookmarkPlus, Check, Edit3, Search, Trash2, X } from 'lucide-react';

export interface PageBookmark {
  id: string;
  page: number;
  name: string;
  createdAt: number;
}

interface PageToolsProps {
  currentPage: number;
  totalPages: number;
  bookmarks: PageBookmark[];
  onJumpToPage: (pageNumber: number) => void;
  onAddBookmark: (name: string) => void;
  onRenameBookmark: (id: string, name: string) => void;
  onDeleteBookmark: (id: string) => void;
}

export const PageTools: React.FC<PageToolsProps> = ({
  currentPage,
  totalPages,
  bookmarks,
  onJumpToPage,
  onAddBookmark,
  onRenameBookmark,
  onDeleteBookmark,
}) => {
  const [jumpValue, setJumpValue] = useState(String(currentPage));
  const [open, setOpen] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const sortedBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => a.page - b.page || a.createdAt - b.createdAt),
    [bookmarks]
  );

  const currentPageBookmarked = useMemo(
    () => bookmarks.some((b) => b.page === currentPage),
    [bookmarks, currentPage]
  );

  const handleJump = () => {
    const target = Number(jumpValue);
    if (!Number.isInteger(target)) return;
    if (target < 1 || target > totalPages) return;
    onJumpToPage(target);
  };

  const handleAddBookmark = () => {
    const fallback = `Page ${currentPage}`;
    onAddBookmark(newBookmarkName.trim() || fallback);
    setNewBookmarkName('');
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingBookmarkId(id);
    setEditingName(currentName);
  };

  const saveEdit = () => {
    if (!editingBookmarkId) return;
    const next = editingName.trim();
    if (!next) return;
    onRenameBookmark(editingBookmarkId, next);
    setEditingBookmarkId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingBookmarkId(null);
    setEditingName('');
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 bg-white/10 dark:bg-dark-700/20 border border-white/20 rounded-xl px-2.5 py-1.5">
          <Search className="w-4 h-4 text-white/70" />
          <input
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJump();
            }}
            className="w-14 sm:w-16 bg-transparent text-white text-sm focus:outline-none"
            aria-label="Go to page number"
            placeholder="Page"
          />
          <span className="text-white/50 text-xs">/ {totalPages}</span>
          <button
            onClick={handleJump}
            className="text-xs px-2 py-1 rounded-lg bg-blue-500/70 text-white hover:bg-blue-500 transition-colors"
          >
            Go
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Bookmarks</span>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-3 w-[320px] max-w-[92vw] bg-slate-900/85 border border-white/20 backdrop-blur-2xl rounded-2xl shadow-2xl z-[90] p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold text-sm">Bookmarks</h4>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-3 p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <BookmarkPlus className="w-4 h-4 text-amber-300" />
              <span className="text-white/80 text-xs">Add current page ({currentPage})</span>
            </div>
            <div className="flex gap-2">
              <input
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
                className="flex-1 bg-white/10 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none"
                placeholder="Bookmark name"
              />
              <button
                onClick={handleAddBookmark}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-500/80 text-white hover:bg-amber-500"
              >
                Add
              </button>
            </div>
            {currentPageBookmarked && (
              <p className="text-[11px] text-emerald-300 mt-1.5">Current page already bookmarked.</p>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {sortedBookmarks.length === 0 ? (
              <p className="text-white/55 text-xs px-1 py-2">No bookmarks yet.</p>
            ) : (
              sortedBookmarks.map((b) => (
                <div key={b.id} className="p-2 rounded-xl bg-white/5 border border-white/10">
                  {editingBookmarkId === b.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <button onClick={saveEdit} className="text-emerald-300 hover:text-emerald-200">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="text-white/60 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onJumpToPage(b.page)}
                        className="flex-1 text-left"
                      >
                        <p className="text-white text-sm font-medium truncate">{b.name}</p>
                        <p className="text-white/60 text-[11px]">Page {b.page}</p>
                      </button>
                      <button
                        onClick={() => startEdit(b.id, b.name)}
                        className="text-white/65 hover:text-white"
                        title="Rename bookmark"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBookmark(b.id)}
                        className="text-rose-300 hover:text-rose-200"
                        title="Delete bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
