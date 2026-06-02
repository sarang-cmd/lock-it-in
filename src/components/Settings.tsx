import { useState } from 'react';
import { ChevronLeft, Download, Upload, Trash2, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { AppSettings } from '../types';
import { settingsStorage, db } from '../lib/storage';
import { downloadFile } from '../lib/utils';
import { toast } from './ui/Toast';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>(settingsStorage.get());

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = settingsStorage.update({ [key]: value });
    setSettings(updated);
  };

  const handleExportAll = async () => {
    try {
      const json = await db.export.allToJSON();
      const filename = `lock-it-in-backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(json, filename);
      toast('exported all sets 🔒', 'success');
    } catch {
      toast('something broke. try again.', 'error');
    }
  };

  const handleImportBackup = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        await db.export.fromJSON(json);
        toast('backup restored 🔒', 'success');
      } catch {
        toast("couldn't read that. check the format, gang.", 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (!confirm('clear ALL data? this cannot be undone.')) return;
    const sets = await db.sets.getAll();
    for (const set of sets) {
      await db.sets.delete(set.id);
    }
    localStorage.removeItem('lii_settings');
    localStorage.removeItem('lii_onboarded');
    toast('all data cleared', 'info');
    setTimeout(() => window.location.reload(), 1000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} className="transition-colors" style={{ color: value ? '#7C3AED' : '#4B5563' }}>
      {value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
    </button>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0A0A14' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-4 sticky top-0 z-20"
        style={{ background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2D2B55' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 text-sm"
          style={{ color: '#9CA3AF' }}
        >
          <ChevronLeft size={18} /> back
        </button>
        <h1 className="font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>settings</h1>
        <div className="w-20" />
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {/* Study preferences */}
        <Section title="study preferences">
          <SettingRow
            label="fuzzy matching"
            desc="accept answers with small typos"
            right={<Toggle value={settings.fuzzyMatchEnabled} onChange={v => updateSetting('fuzzyMatchEnabled', v)} />}
          />
          <SettingRow
            label="study both sides"
            desc="flip term/definition randomly"
            right={<Toggle value={settings.studyBothSides} onChange={v => updateSetting('studyBothSides', v)} />}
          />
          <SettingRow
            label="learn round size"
            desc="questions per learn round"
            right={
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateSetting('learnRoundSize', Math.max(3, settings.learnRoundSize - 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: '#2D2B55' }}
                >-</button>
                <span
                  className="w-8 text-center font-bold text-white"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {settings.learnRoundSize}
                </span>
                <button
                  onClick={() => updateSetting('learnRoundSize', Math.min(20, settings.learnRoundSize + 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: '#2D2B55' }}
                >+</button>
              </div>
            }
          />
        </Section>

        {/* Streak */}
        <Section title="streak">
          <SettingRow
            label="current streak"
            desc={`longest: ${settings.streakData.longestStreak} days`}
            right={
              <span
                className="text-2xl font-bold"
                style={{ color: '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {settings.streakData.currentStreak}🔥
              </span>
            }
          />
        </Section>

        {/* Data */}
        <Section title="data & backup">
          <SettingRow
            label="export all sets"
            desc="download a full backup JSON"
            right={
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <Download size={14} /> export
              </button>
            }
          />
          <SettingRow
            label="restore from backup"
            desc="import a .json backup file"
            right={
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <Upload size={14} /> import
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleImportBackup(e.target.files[0])}
                />
              </label>
            }
          />
        </Section>

        {/* Danger zone */}
        <Section title="danger zone">
          <SettingRow
            label="clear all data"
            desc="delete everything. can't undo this."
            right={
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <Trash2 size={14} /> clear
              </button>
            }
          />
        </Section>

        {/* About */}
        <div
          className="p-4 rounded-xl text-sm"
          style={{ background: '#12121F', border: '1px solid #2D2B55' }}
        >
          <div className="flex items-center gap-2 mb-1" style={{ color: '#A78BFA' }}>
            <Info size={14} />
            <span className="font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Lock It In! v1.0.0</span>
          </div>
          <p style={{ color: '#4B5563' }}>
            your sets live in your browser. no login needed. no tracking. no ads.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: '#4B5563', fontFamily: 'DM Sans, sans-serif' }}
      >
        {title}
      </h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2D2B55' }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, desc, right }: { label: string; desc: string; right: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: '1px solid #2D2B55', background: '#12121F' }}
    >
      <div>
        <p className="text-sm font-medium text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: '#4B5563' }}>{desc}</p>
      </div>
      <div className="ml-4 shrink-0">{right}</div>
    </div>
  );
}
