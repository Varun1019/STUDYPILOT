import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Card, Badge } from '../common/CommonUI';

export function SettingsView({ 
  settings, 
  onSaveSettings, 
  onLoadDemoData, 
  onExportData, 
  onImportData, 
  onResetAllData,
  onNavigateTab
}) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [provider, setProvider] = useState(settings.provider || 'openai');
  const [model, setModel] = useState(settings.model || 'gpt-4o-mini');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const isAIMode = !!apiKey.trim();

  const handleSave = () => {
    onSaveSettings({
      apiKey: apiKey.trim(),
      provider,
      model
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    try {
      onImportData(importJsonText.trim());
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 2500);
    } catch (err) {
      alert("Invalid JSON format: " + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Settings & Data</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Configure your AI provider credentials, sample data, and local backups.
          </p>
        </div>

        <Badge variant="primary">
          AI Engine Active
        </Badge>
      </div>

      {/* SECTION 1: AI & MODEL CONFIGURATION */}
      <Card title="AI Provider Credentials">
        <div className="space-y-4">
          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              <strong>Local Privacy:</strong> API keys are stored strictly in your browser (`localStorage`). They are never sent to external servers except direct calls to your chosen LLM provider.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="openai">Standard AI API (OpenAI compat)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">High-Speed Cloud Engine</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Model Name
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. gpt-4o-mini, claude-3-5-sonnet"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Configured via server .env or enter custom key"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs apple-press transition-colors flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save Credentials'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* SECTION 2: SAMPLE DATA */}
      <Card title="Sample Student Baseline">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40">
          <div className="space-y-1">
            <h5 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" /> Load Demo Student Data
            </h5>
            <p className="text-xs text-emerald-800 font-medium">
              Populates sample engineering student profile ("Alex Rivera - Data Structures & Algorithms"), quiz attempts, weak topics, notes, flashcards, and schedule.
            </p>
          </div>

          <button
            onClick={onLoadDemoData}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs apple-press transition-colors shrink-0"
          >
            Load Demo Data
          </button>
        </div>
      </Card>

      {/* SECTION 3: BACKUP & DATA RESET */}
      <Card title="Data Backup & Reset">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-600" /> Export JSON Backup
              </h5>
              <p className="text-xs text-slate-500 font-medium">
                Download full data payload (profiles, quiz attempts, mastery scores, flashcards, notes, plan).
              </p>
              <button
                onClick={onExportData}
                className="w-full py-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs apple-press transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON Backup
              </button>
            </div>

            {/* Import */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
              <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-purple-600" /> Import JSON Backup
              </h5>
              <p className="text-xs text-slate-500 font-medium">
                Paste JSON backup string below to restore data.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste JSON here..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white text-slate-900 text-xs font-mono outline-hidden"
                />
                <button
                  onClick={handleImportSubmit}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs apple-press transition-colors shrink-0"
                >
                  {importSuccess ? 'Imported!' : 'Import'}
                </button>
              </div>
            </div>
          </div>

          {/* Reset */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600">Danger Zone</span>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to reset all StudyPilot data? This action cannot be undone.")) {
                  onResetAllData();
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs apple-press transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Reset All Data
            </button>
          </div>
        </div>
      </Card>

      {/* Next Step Banner */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between shadow-xs">
        <div>
          <div className="text-xs font-bold text-slate-900 tracking-tight">Next Step</div>
          <div className="text-xs text-slate-500">Return to Home to begin your revision.</div>
        </div>

        <button
          onClick={() => onNavigateTab && onNavigateTab('home')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs apple-press transition-colors"
        >
          <span>Return Home</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
