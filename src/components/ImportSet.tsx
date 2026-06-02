import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, ClipboardPaste, Check, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { StudySet, Term } from '../types';
import { db } from '../lib/storage';
import { nanoid } from '../lib/utils';
import { parseAutoDetect, parseCSV, parseJSON } from '../lib/import-parser';
import { toast } from './ui/Toast';

interface ImportSetProps {
  onComplete: (set: StudySet) => void;
  onCancel: () => void;
}

type Tab = 'paste' | 'file';

export default function ImportSet({ onComplete, onCancel }: ImportSetProps) {
  const [tab, setTab] = useState<Tab>('paste');
  const [setName, setSetName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedTerms, setParsedTerms] = useState<Term[]>([]);
  const [parseError, setParseError] = useState('');
  const [step, setStep] = useState<'input' | 'preview' | 'naming'>('naming');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseContent = (content: string, format?: string) => {
    let result;
    if (format === 'csv') result = parseCSV(content);
    else if (format === 'json') result = parseJSON(content);
    else result = parseAutoDetect(content);

    if (result.error) {
      setParseError(result.error);
      setParsedTerms([]);
    } else {
      setParseError('');
      setParsedTerms(result.terms);
      setStep('preview');
      if (result.terms.length >= 50) {
        toast(`locked in ${result.terms.length} terms. that's a whole syllabus.`, 'success', 5000);
      }
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase();
      parseContent(content, ext);
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!setName.trim()) {
      toast('give it a name first', 'error');
      return;
    }
    if (!parsedTerms.length) {
      toast("bro you haven't added anything", 'error');
      return;
    }

    const lower = setName.toLowerCase();
    if (lower.includes('midterm') || lower.includes('finals')) {
      toast('godspeed son 🙏', 'info', 4000);
    }

    setSaving(true);
    const now = new Date().toISOString();
    const set: StudySet = {
      id: nanoid(),
      name: setName.trim(),
      tags: [],
      createdAt: now,
      updatedAt: now,
      terms: parsedTerms,
      sessionCount: 0,
      lastStudied: null,
      ownerId: null,
    };

    try {
      await db.sets.create(set);
      toast('saved 🔒', 'success');
      onComplete(set);
    } catch {
      toast('something broke. try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A14' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-4 sticky top-0 z-20"
        style={{ background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2D2B55' }}
      >
        <button onClick={onCancel} className="p-2 rounded-xl hover:bg-white/5" style={{ color: '#9CA3AF' }}>
          <X size={20} />
        </button>
        <h1 className="text-base font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          import a set
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-5 py-8">
        {/* Step: Naming */}
        {step === 'naming' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center"
          >
            <div className="text-5xl mb-8">📥</div>
            <div
              className="flex flex-wrap items-center justify-center gap-3 text-3xl font-black text-white mb-8"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              <span>Lock</span>
              <input
                value={setName}
                onChange={e => setSetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setName.trim() && setStep('input')}
                placeholder="set name"
                className="border-b-2 bg-transparent text-white text-center outline-none placeholder-gray-600 pb-1"
                style={{
                  borderColor: setName ? '#A78BFA' : '#2D2B55',
                  minWidth: 160,
                  width: `max(160px, ${setName.length + 2}ch)`,
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                  caretColor: '#7C3AED',
                }}
                autoFocus
              />
              <span>In!</span>
            </div>
            <button
              onClick={() => setName.trim() && setStep('input')}
              disabled={!setName.trim()}
              className="flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold"
              style={{
                background: setName.trim() ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : '#1A1A2E',
                color: setName.trim() ? 'white' : '#4B5563',
                fontFamily: 'Syne, sans-serif',
                cursor: setName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Next <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {/* Step: Input */}
        {step === 'input' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Lock {setName} In!
            </h2>
            <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
              paste your content or upload a file
            </p>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {(['paste', 'file'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: tab === t ? '#7C3AED' : '#12121F',
                    color: tab === t ? 'white' : '#9CA3AF',
                    border: `1px solid ${tab === t ? '#7C3AED' : '#2D2B55'}`,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {t === 'paste' ? (
                    <span className="flex items-center gap-2"><ClipboardPaste size={14} /> Paste</span>
                  ) : (
                    <span className="flex items-center gap-2"><Upload size={14} /> File</span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'paste' && (
              <div>
                <textarea
                  value={pasteContent}
                  onChange={e => setPasteContent(e.target.value)}
                  placeholder={`paste your content here.\n\nformats supported:\n- tab separated (term\\tdefinition)\n- comma separated\n- Quizlet export\n- JSON`}
                  className="w-full p-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none input-glow"
                  style={{
                    background: '#12121F',
                    border: '1px solid #2D2B55',
                    fontFamily: 'JetBrains Mono, monospace',
                    minHeight: 200,
                  }}
                  rows={10}
                />
                <p className="text-xs mt-2 mb-4" style={{ color: '#4B5563' }}>
                  auto-detects: tab, comma, semicolon, pipe delimiters
                </p>
                <button
                  onClick={() => parseContent(pasteContent)}
                  disabled={!pasteContent.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{
                    background: pasteContent.trim() ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : '#1A1A2E',
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: pasteContent.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Parse Content
                </button>
              </div>
            )}

            {tab === 'file' && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.csv,.json"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-4 p-10 rounded-2xl transition-all"
                  style={{
                    background: 'rgba(124,58,237,0.05)',
                    border: '2px dashed #2D2B55',
                    color: '#A78BFA',
                  }}
                >
                  <FileText size={32} />
                  <div>
                    <p className="font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      click to upload
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#4B5563' }}>
                      .txt, .csv, .json supported
                    </p>
                  </div>
                </button>
              </div>
            )}

            {parseError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mt-4 p-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444',
                }}
              >
                <AlertCircle size={16} />
                {parseError}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  preview
                </h2>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>
                  {parsedTerms.length} terms parsed
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="px-3 py-1.5 rounded-xl text-sm"
                  style={{ background: '#12121F', border: '1px solid #2D2B55', color: '#9CA3AF' }}
                >
                  back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {saving ? 'saving...' : <><Check size={14} /> Lock It In 🔒</>}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {parsedTerms.slice(0, 20).map((term, i) => (
                <div
                  key={term.id}
                  className="flex gap-4 p-3 rounded-xl"
                  style={{ background: '#12121F', border: '1px solid #2D2B55' }}
                >
                  <span className="text-xs shrink-0 mt-1" style={{ color: '#4B5563', fontFamily: 'JetBrains Mono, monospace' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                    <span className="font-medium text-white">{term.term}</span>
                    <span style={{ color: '#9CA3AF' }}>{term.definition}</span>
                  </div>
                </div>
              ))}
              {parsedTerms.length > 20 && (
                <p className="text-sm text-center py-3" style={{ color: '#4B5563' }}>
                  ...and {parsedTerms.length - 20} more
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
