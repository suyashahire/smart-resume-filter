'use client';

import { motion } from 'framer-motion';
import { Plus, Star, FileText, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ResumeVersion } from '@/lib/api';

interface ResumeVersionTabsProps {
  versions: ResumeVersion[];
  activeVersionId: string | null;
  onSelect: (versionId: string) => void;
  onAddVersion: () => void;
  onSetPrimary: (versionId: string) => void;
  onRename: (versionId: string, newLabel: string) => void;
  onDelete: (versionId: string) => void;
  maxVersions?: number;
}

export default function ResumeVersionTabs({
  versions,
  activeVersionId,
  onSelect,
  onAddVersion,
  onSetPrimary,
  onRename,
  onDelete,
  maxVersions = 3,
}: ResumeVersionTabsProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingLabel]);

  const handleStartRename = (version: ResumeVersion) => {
    setEditingLabel(version.id);
    setEditValue(version.version_label || `Version ${version.version_number}`);
    setMenuOpen(null);
  };

  const handleSaveRename = (versionId: string) => {
    if (editValue.trim()) {
      onRename(versionId, editValue.trim());
    }
    setEditingLabel(null);
  };

  const getVersionLabel = (v: ResumeVersion) => {
    return v.version_label || `Version ${v.version_number}`;
  };

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      {versions.map((version) => {
        const isActive = version.id === activeVersionId;
        const isPrimary = version.is_primary;

        return (
          <div key={version.id} className="relative flex-shrink-0">
            {editingLabel === version.id ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveRename(version.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(version.id);
                    if (e.key === 'Escape') setEditingLabel(null);
                  }}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-candidate-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-candidate-500 w-32"
                />
              </div>
            ) : (
              <motion.button
                type="button"
                onClick={() => onSelect(version.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-candidate-500 text-white shadow-md shadow-candidate-500/25'
                    : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60 hover:border-candidate-400/50 dark:hover:border-candidate-500/50 hover:bg-white dark:hover:bg-gray-800'
                  }
                `}
              >
                <FileText className="h-4 w-4" />
                <span className="max-w-[100px] truncate">{getVersionLabel(version)}</span>
                {isPrimary && (
                  <span className={`
                    flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium
                    ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }
                  `}>
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </span>
                )}

                {/* Menu trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === version.id ? null : version.id);
                  }}
                  className={`
                    ml-1 p-1 rounded-md transition-colors
                    ${isActive
                      ? 'hover:bg-white/20 text-white/80 hover:text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </motion.button>
            )}

            {/* Dropdown menu */}
            {menuOpen === version.id && (
              <div
                ref={menuRef}
                className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
              >
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => {
                      onSetPrimary(version.id);
                      setMenuOpen(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Star className="h-4 w-4 text-amber-500" />
                    Set as Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleStartRename(version)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-blue-500" />
                  Rename
                </button>
                {versions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(version.id);
                      setMenuOpen(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Version Button */}
      {versions.length < maxVersions && (
        <motion.button
          type="button"
          onClick={onAddVersion}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-candidate-400 hover:text-candidate-600 dark:hover:border-candidate-500 dark:hover:text-candidate-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Version
        </motion.button>
      )}
    </div>
  );
}
