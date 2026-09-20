import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, User, GraduationCap, AlertTriangle } from 'lucide-react';
import type { Student } from '../../types/student.types';

interface StudentSelectComboboxProps {
  students: Student[];
  selectedId?: number | string;
  onSelect: (studentId: number) => void;
  loading?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

export const StudentSelectCombobox: React.FC<StudentSelectComboboxProps> = ({
  students,
  selectedId,
  onSelect,
  loading = false,
  placeholder = 'Search & select student...',
  ariaLabel = 'Select Student',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const numericSelectedId = selectedId ? Number(selectedId) : null;
  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === numericSelectedId) || null;
  }, [students, numericSelectedId]);

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;

    return students.filter((s) => {
      const numMatch = s.student_number?.toLowerCase().includes(q);
      const firstMatch = s.first_name?.toLowerCase().includes(q);
      const lastMatch = s.last_name?.toLowerCase().includes(q);
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      const progMatch = s.program?.code?.toLowerCase().includes(q);
      const typeMatch = s.student_type?.toLowerCase().includes(q);
      return numMatch || firstMatch || lastMatch || fullName.includes(q) || progMatch || typeMatch;
    });
  }, [students, searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredStudents.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredStudents.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredStudents[highlightedIndex]) {
          onSelect(filteredStudents[highlightedIndex].id);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[highlightedIndex] && typeof items[highlightedIndex].scrollIntoView === 'function') {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Helper to highlight matching substrings safely
  const renderHighlighted = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-emerald-500/30 text-emerald-200 font-bold px-0.5 rounded-sm"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="relative inline-block w-full sm:w-80 text-left" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Combobox Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={loading}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all cursor-pointer shadow-sm disabled:opacity-60"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
            <User size={13} />
          </div>

          {loading ? (
            <span className="text-slate-500 italic">Loading student database...</span>
          ) : activeStudent ? (
            <div className="flex items-center gap-2 truncate text-left">
              <span className="font-mono font-bold text-white text-[11px] shrink-0">
                {activeStudent.student_number}
              </span>
              <span className="truncate text-slate-200 font-semibold">
                {activeStudent.last_name}, {activeStudent.first_name}
              </span>
              <span
                className={`hidden md:inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                  activeStudent.student_type === 'IRREGULAR'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {activeStudent.student_type === 'IRREGULAR' ? 'IRR' : 'REG'}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          size={15}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`}
        />
      </button>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full sm:w-96 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in backdrop-blur-md">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search by ID, name, or program..."
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Live Matching Cases Preview Bar */}
            <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {searchQuery.trim() ? (
                  <span>
                    Matching cases: <strong className="text-emerald-400">{filteredStudents.length}</strong> of{' '}
                    {students.length}
                  </span>
                ) : (
                  <span>
                    All students: <strong className="text-slate-300">{students.length}</strong> total
                  </span>
                )}
              </span>
              {searchQuery.trim() && (
                <span className="text-[10px] text-slate-500 font-mono italic">
                  Press Enter to select top match
                </span>
              )}
            </div>
          </div>

          {/* Results List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto divide-y divide-slate-800/40 focus:outline-none p-1"
          >
            {filteredStudents.length === 0 ? (
              <li className="py-8 px-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500 mb-2">
                  <AlertTriangle size={18} />
                </div>
                <div className="text-xs font-semibold text-slate-300">No matching students found</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  No records match "{searchQuery}". Try student number or last name.
                </div>
              </li>
            ) : (
              filteredStudents.map((s, idx) => {
                const isSelected = s.id === numericSelectedId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(s.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                        : isHighlighted
                          ? 'bg-slate-800/80 text-white'
                          : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {/* Top line: Student number & badges */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {renderHighlighted(s.student_number, searchQuery)}
                        </span>
                        <span className="text-slate-600 text-xs">&bull;</span>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <GraduationCap size={11} className="text-slate-500" />
                          {s.program?.code || 'GEN'} (Yr {s.year_level || 1})
                        </span>
                        <span
                          className={`ml-auto px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            s.student_type === 'IRREGULAR'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {s.student_type}
                        </span>
                      </div>

                      {/* Bottom line: Full name */}
                      <div className="text-xs font-medium text-slate-200 mt-1 truncate">
                        {renderHighlighted(`${s.last_name}, ${s.first_name}`, searchQuery)}
                        {s.middle_name && (
                          <span className="text-slate-500 ml-1">
                            {renderHighlighted(s.middle_name, searchQuery)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check size={12} />
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Quick Footer */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Use ↑↓ keys to navigate</span>
            <span>Esc to cancel</span>
          </div>
        </div>
      )}
    </div>
  );
};
