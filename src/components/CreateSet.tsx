import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Tag, Check, ArrowRight } from 'lucide-react';
import { StudySet, Term } from '../types';
import { db } from '../lib/storage';
import { nanoid } from '../lib/utils';
import { toast } from './ui/Toast';

interface CreateSetProps {
  existingSet?: StudySet | null;
  onComplete: (set: StudySet) => void;
  onCancel: () => void;
}

function createEmptyTerm(): Term {
  return {
    id: nanoid(),
    term: '',
    definition: '',
    masteryScore: 0,
    lastSeen: null,
    timesCorrect: 0,
    timesWrong: 0,
  };
}

export default function CreateSet({ existingSet, onComplete, onCancel }: CreateSetProps) {
  const [step, setStep] = useState<'name' | 'terms'>(existingSet ? 'terms' : 'name');
  const [setName, setSetName] = useState(existingSet?.name ?? '');
  const [terms, setTerms] = useState<Term[]>(
    existingSet?.terms?.length ? existingSet.terms : [createEmptyTerm(), createEmptyTerm()]
  );
  const [tags, setTags] = useState<string[]>(existingSet?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'name' && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [step]);

  // Keyboard shortcut: Cmd/Ctrl+S saves
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (step === 'terms') handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const updateTerm = (id: string, field: 'term' | 'definition', value: string) => {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTerm = () => {
    setTerms(prev => [...prev, createEmptyTerm()]);
    if (terms.length >= 100) {
      toast("that's 100+ terms. you're not playing around.", 'info');
    }
  };

  const deleteTerm = (id: string) => {
    if (terms.length <= 1) return;
    setTerms(prev => prev.filter(t => t.id !== id));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSave = useCallback(async () => {
    const validTerms = terms.filter(t => t.term.trim() && t.definition.trim());
    if (!validTerms.length) {
      toast("bro you haven't added anything", 'error');
      return;
    }
    if (!setName.trim()) {
      toast('give it a name first', 'error');
      return;
    }

    // Fun easter eggs
    const lowerName = setName.toLowerCase();
    if (lowerName.includes('midterm') || lowerName.includes('finals')) {
      toast('godspeed son 🙏', 'info', 4000);
    }

    setSaving(true);
    const now = new Date().toISOString();
    const set: StudySet = {
      id: existingSet?.id ?? nanoid(),
      name: setName.trim(),
      tags,
      createdAt: existingSet?.createdAt ?? now,
      updatedAt: now,
      terms: validTerms,
      sessionCount: existingSet?.sessionCount ?? 0,
      lastStudied: existingSet?.lastStudied ?? null,
      ownerId: null,
    };

    try {
      if (existingSet) {
        await db.sets.update(set);
      } else {
        await db.sets.create(set);
      }
      toast('saved 🔒', 'success');
      onComplete(set);
    } catch {
      toast('something broke. try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [terms, setName, tags, existingSet, onComplete]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0A0A14' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-4 sticky top-0 z-20"
        style={{
          background: 'rgba(10,10,20,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #2D2B55',
        }}
      >
        <button
          onClick={onCancel}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: '#9CA3AF' }}
        >
          <X size={20} />
        </button>
        <h1
          className="text-base font-bold text-white"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {existingSet ? 'edit set' : 'new set'}
        </h1>
        {step === 'terms' ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: saving ? '#2D2B55' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {saving ? 'saving...' : <>Lock It In <Check size={14} /></>}
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-5">
        <AnimatePresence mode="wait">
          {step === 'name' ? (
            <motion.div
              key="name-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[80vh] text-center"
            >
              <p className="text-6xl mb-8">🔒</p>
              <div className="w-full max-w-xl">
                <div
                  className="flex flex-wrap items-center justify-center gap-3 text-4xl font-black text-white mb-8"
                  style={{ fontFamily: 'Syne, sans-serif', lineHeight: 1.2 }}
                >
                  <span>Lock</span>
                  <div className="relative">
                    <input
                      ref={nameInputRef}
                      value={setName}
                      onChange={e => setSetName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && setName.trim() && setStep('terms')}
                      placeholder="your set name"
                      className="border-b-2 bg-transparent text-white text-center outline-none placeholder-gray-600 pb-1"
                      style={{
                        borderColor: setName ? '#A78BFA' : '#2D2B55',
                        minWidth: 200,
                        width: `max(200px, ${setName.length + 2}ch)`,
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 800,
                        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                        caretColor: '#7C3AED',
                        transition: 'border-color 0.2s',
                      }}
                    />
                    {setName && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
                      />
                    )}
                  </div>
                  <span>In!</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setName.trim() && setStep('terms')}
                  disabled={!setName.trim()}
                  className="flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg mx-auto transition-all"
                  style={{
                    background: setName.trim()
                      ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                      : '#1A1A2E',
                    color: setName.trim() ? 'white' : '#4B5563',
                    fontFamily: 'Syne, sans-serif',
                    cursor: setName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Let's Go <ArrowRight size={20} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="terms-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8"
            >
              {/* Set name display */}
              <div className="flex items-center gap-3 mb-6">
                <h2
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Lock {setName} In!
                </h2>
              </div>

              {/* Tags */}
              <div
                className="flex flex-wrap items-center gap-2 p-3 rounded-xl mb-6"
                style={{ background: '#12121F', border: '1px solid #2D2B55' }}
              >
                <Tag size={14} className="text-violet-400 shrink-0" />
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 tag-chip">
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-400 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={tags.length === 0 ? 'add tags (press Enter)' : 'add tag...'}
                  className="flex-1 min-w-20 bg-transparent text-sm text-white outline-none placeholder-gray-600"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>

              {/* Terms */}
              <div className="space-y-3">
                <AnimatePresence>
                  {terms.map((term, i) => (
                    <motion.div
                      key={term.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ border: '1px solid #2D2B55', background: '#12121F' }}
                    >
                      <div
                        className="px-4 py-2 flex items-center justify-between"
                        style={{ borderBottom: '1px solid #2D2B55', background: '#0F0F1A' }}
                      >
                        <span
                          className="text-xs font-medium"
                          style={{ color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {i + 1}
                        </span>
                        <button
                          onClick={() => deleteTerm(term.id)}
                          disabled={terms.length <= 1}
                          className="p-1 rounded-lg hover:text-red-400 transition-colors"
                          style={{ color: '#4B5563' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 divide-x" style={{ borderColor: '#2D2B55' }}>
                        <div className="p-4">
                          <label className="text-xs font-medium mb-2 block" style={{ color: '#4B5563' }}>
                            TERM
                          </label>
                          <textarea
                            value={term.term}
                            onChange={e => updateTerm(term.id, 'term', e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Tab') {
                                e.preventDefault();
                                const defEl = document.getElementById(`def-${term.id}`);
                                defEl?.focus();
                              }
                            }}
                            placeholder="enter term"
                            className="w-full bg-transparent text-sm text-white outline-none resize-none placeholder-gray-600"
                            style={{ fontFamily: 'DM Sans, sans-serif', minHeight: 48 }}
                            rows={2}
                          />
                        </div>
                        <div className="p-4">
                          <label className="text-xs font-medium mb-2 block" style={{ color: '#4B5563' }}>
                            DEFINITION
                          </label>
                          <textarea
                            id={`def-${term.id}`}
                            value={term.definition}
                            onChange={e => updateTerm(term.id, 'definition', e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                addTerm();
                              }
                            }}
                            placeholder="enter definition"
                            className="w-full bg-transparent text-sm text-white outline-none resize-none placeholder-gray-600"
                            style={{ fontFamily: 'DM Sans, sans-serif', minHeight: 48 }}
                            rows={2}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add term button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={addTerm}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl mt-3 font-semibold text-sm transition-all"
                style={{
                  background: 'rgba(124,58,237,0.05)',
                  border: '2px dashed #2D2B55',
                  color: '#A78BFA',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <Plus size={16} />
                + Lock Another One In
              </motion.button>

              <div className="pb-8 mt-4 flex items-center justify-between text-xs" style={{ color: '#4B5563' }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{terms.filter(t => t.term && t.definition).length} / {terms.length} terms ready</span>
                <span style={{ fontFamily: 'DM Sans, sans-serif' }}>Cmd+S to save</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
