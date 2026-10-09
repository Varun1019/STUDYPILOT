import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  ArrowRight,
  Upload,
  FileText,
  Trash2,
  Edit2,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  FolderOpen,
  Plus,
  Clock
} from 'lucide-react';
import { Card, Modal, ProgressBar } from '../common/CommonUI';
import { aiService } from '../../services/aiService';
import { storage } from '../../lib/storage';
import { extractPdfText } from '../../lib/pdfExtractor';

export function NotesFlashcardsView({ 
  topics = [], 
  activeProfile, 
  onNavigateTab,
  onUploadChange,
  settings 
}) {
  // Requirement 1: Defaults to 'notes' tab
  const [activeTab, setActiveTab] = useState('notes');
  const [copied, setCopied] = useState(false);

  // IndexedDB Notes State (Requirement 2 & 4)
  const [savedNotes, setSavedNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [renamingNote, setRenamingNote] = useState(null);
  const [newNoteName, setNewNoteName] = useState('');

  // Flashcards Viewer State
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [numCards, setNumCards] = useState(15);

  // Extraction & Processing State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatusText, setExtractStatusText] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  const fileInputRef = useRef(null);

  // Reload saved notes list from IndexedDB on page load (Requirement 4)
  const reloadNotesFromStorage = async () => {
    try {
      const list = await storage.getNotes(activeProfile?.subject);
      setSavedNotes(list);
      if (list.length > 0) {
        // Keep active or set first
        setActiveNote(prev => (prev && list.find(n => n.id === prev.id)) || list[0]);
      } else {
        setActiveNote(null);
      }
      if (onUploadChange) onUploadChange();
    } catch (err) {
      console.warn('[NotesFlashcardsView] Storage load error:', err);
    }
  };

  useEffect(() => {
    reloadNotesFromStorage();
  }, [activeProfile?.id, activeProfile?.subject]);

  // Flashcards for the active note
  const cardList = activeNote?.flashcards || [];
  const currentCard = cardList[cardIdx] || cardList[0];

  // 1. File Selection & Drag-and-Drop
  const handleFileChange = (file) => {
    setUploadError(null);
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    const validExts = ['.pdf', '.txt', '.md'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadError('Unsupported file format. Please upload a PDF (.pdf), Plain Text (.txt), or Markdown (.md) file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // 2. Background Summarization with 30-Second Timeout (Requirement 4)
  const runBackgroundSummary = async (note) => {
    if (!note || note.summary) return; // Never re-summarize a file that already has one!

    // Mark status as 'summarizing'
    await storage.updateNote(note.id, { status: 'summarizing', errorMsg: null });
    setSavedNotes(prev => prev.map(n => n.id === note.id ? { ...n, status: 'summarizing', errorMsg: null } : n));

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_30S')), 30000)
    );

    try {
      const summaryRes = await Promise.race([
        aiService.generateNotes({
          topicName: note.fileName.replace(/\.[^/.]+$/, ''),
          subject: activeProfile?.subject || 'Engineering',
          text: note.extractedText
        }),
        timeoutPromise
      ]);

      const updated = await storage.updateNote(note.id, {
        summary: summaryRes.text,
        status: 'done',
        errorMsg: null
      });

      setSavedNotes(prev => prev.map(n => n.id === note.id ? updated : n));
      setActiveNote(prev => (prev?.id === note.id ? updated : prev));

      // Also trigger flashcards in background if empty
      if (!note.flashcards || note.flashcards.length === 0) {
        try {
          const cardsRes = await aiService.generateCardsFromText({
            text: note.extractedText,
            subject: activeProfile?.subject || 'Engineering',
            topic: note.fileName,
            count: 15
          });
          if (cardsRes.success && cardsRes.cards) {
            const withCards = await storage.updateNote(note.id, { flashcards: cardsRes.cards });
            setSavedNotes(prev => prev.map(n => n.id === note.id ? withCards : n));
            setActiveNote(prev => (prev?.id === note.id ? withCards : prev));
          }
        } catch {}
      }
    } catch (err) {
      console.warn('[Background Summary Error]', err);
      const isTimeout = err.message === 'TIMEOUT_30S';
      const errorMsg = isTimeout ? 'Timed out after 30s. Click Retry.' : (err.message || 'Summarization failed.');
      const updated = await storage.updateNote(note.id, { status: 'error', errorMsg });
      setSavedNotes(prev => prev.map(n => n.id === note.id ? updated : n));
    }
  };

  // 3. Browser-Side Extraction with pdfjs-dist (Requirement 4)
  const handleUploadAndProcess = async () => {
    setUploadError(null);
    if (!selectedFile && (!pastedText || pastedText.trim().length < 20)) {
      setUploadError('Please select a PDF/TXT/MD file or paste notes text.');
      return;
    }

    setIsExtracting(true);
    setExtractStatusText('Reading file…');

    try {
      let extractedText = '';
      const fileName = selectedFile ? selectedFile.name : 'Pasted_Notes.txt';

      if (selectedFile) {
        if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
          setExtractStatusText('Reading file with browser PDF parser…');
          extractedText = await extractPdfText(selectedFile);
        } else {
          setExtractStatusText('Reading text content…');
          extractedText = await selectedFile.text();
        }
      } else {
        extractedText = pastedText.trim();
      }

      if (!extractedText || extractedText.trim().length < 15) {
        throw new Error('No readable text found in this document.');
      }

      // Save note immediately to IndexedDB notes store
      const newNote = await storage.saveNote({
        fileName,
        uploadedAt: new Date().toISOString(),
        extractedText: extractedText.trim(),
        summary: '',
        status: 'summarizing',
        subject: activeProfile?.subject || 'Engineering',
        flashcards: []
      });

      // Update state and show note in the list right away!
      setSavedNotes(prev => [newNote, ...prev]);
      setActiveNote(newNote);
      setActiveTab('notes');

      // Close modal immediately so user keeps using the app!
      setSelectedFile(null);
      setPastedText('');
      setUploadModalOpen(false);
      setIsExtracting(false);

      // Run background summarization with 30s timeout
      runBackgroundSummary(newNote);
    } catch (err) {
      console.error('File extraction error:', err);
      setUploadError(err.message || 'Failed to read file.');
      setIsExtracting(false);
    }
  };

  // 4. Flashcards Generator from Saved Note Text (Requirement 4)
  const handleGenerateFlashcards = async (targetNote = activeNote) => {
    const textToUse = targetNote?.extractedText;
    if (!textToUse || textToUse.trim().length < 20) {
      setUploadModalOpen(true);
      return;
    }

    setIsGeneratingFlashcards(true);
    try {
      const cardRes = await aiService.generateCardsFromText({
        text: textToUse,
        subject: activeProfile?.subject || 'Engineering',
        topic: targetNote.fileName,
        count: numCards
      });

      if (!cardRes.success || !Array.isArray(cardRes.cards) || cardRes.cards.length === 0) {
        throw new Error(cardRes.message || 'Flashcards generation failed.');
      }

      const updated = await storage.updateNote(targetNote.id, { flashcards: cardRes.cards });
      setSavedNotes(prev => prev.map(n => n.id === targetNote.id ? updated : n));
      setActiveNote(updated);
      setCardIdx(0);
      setIsFlipped(false);
      setActiveTab('flashcards');
    } catch (err) {
      console.error('Flashcard error:', err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // 5. Note Management Actions
  const handleOpenNote = (note) => {
    setActiveNote(note);
    setCardIdx(0);
    setIsFlipped(false);
    setActiveTab('notes');
  };

  const handleRenameNote = async () => {
    if (!renamingNote || !newNoteName.trim()) return;
    const updated = await storage.updateNote(renamingNote.id, { fileName: newNoteName.trim() });
    setSavedNotes(prev => prev.map(n => n.id === renamingNote.id ? updated : n));
    if (activeNote?.id === renamingNote.id) setActiveNote(updated);
    setRenamingNote(null);
    setNewNoteName('');
  };

  const handleDeleteNote = async (id) => {
    await storage.deleteNote(id);
    setSavedNotes(prev => prev.filter(n => n.id !== id));
    if (activeNote?.id === id) {
      const remaining = savedNotes.filter(n => n.id !== id);
      setActiveNote(remaining[0] || null);
    }
  };

  const handleCopyNotes = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-mono">
      {/* Top Bar: Prominent Upload & Create Flashcards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b-2 border-black gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-black">STUDY NOTES &amp; CARDS</h1>
          <p className="text-xs text-slate-700 mt-0.5 font-bold uppercase">
            UPLOAD LECTURE NOTES &amp; PDFS TO SYNTHESIZE REVISION SUMMARIES AND PRACTICE DECKS.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="neo-btn-accent text-xs flex items-center justify-center gap-2 py-3 px-4 min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD NOTES / PDF</span>
          </button>

          <button
            onClick={() => handleGenerateFlashcards()}
            disabled={isGeneratingFlashcards || !activeNote}
            className="neo-btn bg-yellow-300 hover:bg-yellow-400 text-black text-xs flex items-center justify-center gap-1.5 py-3 px-4 min-h-[44px] disabled:opacity-50"
          >
            {isGeneratingFlashcards ? <Loader2 className="w-4 h-4 animate-spin text-[#ff2d2d]" /> : <Sparkles className="w-4 h-4 text-black" />}
            <span>CREATE FLASHCARDS</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-2 gap-2">
        <div className="flex border-2 border-black bg-[#f4f1ea] p-1 gap-1">
          {/* Tab 1: Revision Notes */}
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 border-2 border-black text-xs font-display uppercase transition-all min-h-[44px] ${
              activeTab === 'notes' ? 'bg-[#ff2d2d] text-white shadow-[2px_2px_0px_#000]' : 'bg-white text-black hover:bg-yellow-200'
            }`}
          >
            REVISION NOTES
          </button>

          {/* Tab 2: Flashcards (Count) */}
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-4 py-2 border-2 border-black text-xs font-display uppercase transition-all min-h-[44px] ${
              activeTab === 'flashcards' ? 'bg-[#ff2d2d] text-white shadow-[2px_2px_0px_#000]' : 'bg-white text-black hover:bg-yellow-200'
            }`}
          >
            FLASHCARDS ({cardList.length})
          </button>

          {/* Tab 3: My Uploads */}
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 border-2 border-black text-xs font-display uppercase transition-all min-h-[44px] flex items-center gap-1.5 ${
              activeTab === 'uploads' ? 'bg-[#ff2d2d] text-white shadow-[2px_2px_0px_#000]' : 'bg-white text-black hover:bg-yellow-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>MY UPLOADS ({savedNotes.length})</span>
          </button>
        </div>

        {activeNote && (
          <div className="text-xs font-bold text-black uppercase bg-yellow-200 border border-black px-2.5 py-1 truncate max-w-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate">ACTIVE: {activeNote.fileName}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          TAB 1: REVISION NOTES (DEFAULT)
          ========================================================================= */}
      {activeTab === 'notes' && (
        <div className="space-y-4 animate-brutal-in">
          {activeNote ? (
            <Card className="text-xs leading-relaxed space-y-4 font-mono text-black border-2 border-black shadow-[6px_6px_0px_#000]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-black gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#ff2d2d]" />
                  <h3 className="font-display text-sm text-black uppercase">
                    REVISION SUMMARY: {activeNote.fileName}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status indicator */}
                  {activeNote.status === 'summarizing' && (
                    <span className="bg-yellow-200 border border-black text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 text-black animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-[#ff2d2d]" /> SUMMARIZING...
                    </span>
                  )}
                  {activeNote.status === 'done' && (
                    <span className="bg-emerald-100 border border-black text-[10px] font-bold px-2 py-0.5 text-emerald-800">
                      DONE
                    </span>
                  )}
                  {activeNote.status === 'error' && (
                    <button
                      onClick={() => runBackgroundSummary(activeNote)}
                      className="bg-red-100 border border-black text-[10px] font-bold px-2 py-0.5 text-red-700 hover:bg-black hover:text-white flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> RETRY SUMMARY
                    </button>
                  )}

                  {activeNote.summary && (
                    <button
                      onClick={() => handleCopyNotes(activeNote.summary)}
                      className="neo-btn text-[11px] py-1 px-3 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'COPIED' : 'COPY'}</span>
                    </button>
                  )}
                </div>
              </div>

              {activeNote.summary ? (
                <div className="whitespace-pre-line leading-relaxed font-mono">
                  {activeNote.summary}
                </div>
              ) : activeNote.status === 'summarizing' ? (
                <div className="py-8 text-center space-y-3 bg-[#f4f1ea] border-2 border-dashed border-black p-6">
                  <div className="w-8 h-8 mx-auto bg-yellow-300 border-2 border-black flex items-center justify-center animate-spin">
                    <Sparkles className="w-4 h-4 text-black" />
                  </div>
                  <p className="font-bold text-xs uppercase text-black">SUMMARIZING DOCUMENT WITH AI...</p>
                  <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                    Synthesizing high-yield key takeaways and exam concepts. You can keep browsing the app in the meantime.
                  </p>
                </div>
              ) : activeNote.status === 'error' ? (
                <div className="p-4 bg-red-100 border-2 border-black space-y-2">
                  <p className="font-bold text-xs text-red-700 uppercase">
                    {activeNote.errorMsg || 'Failed to synthesize summary within 30 seconds.'}
                  </p>
                  <button
                    onClick={() => runBackgroundSummary(activeNote)}
                    className="neo-btn-accent text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> RETRY NOW
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <button
                    onClick={() => runBackgroundSummary(activeNote)}
                    className="neo-btn-accent text-xs py-2 px-4"
                  >
                    GENERATE SUMMARY FOR THIS NOTE
                  </button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="text-center py-12 space-y-3 border-2 border-dashed border-black bg-[#f4f1ea]">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-display text-black uppercase">NO REVISION SUMMARY YET</h3>
              <p className="text-xs text-slate-700 max-w-md mx-auto font-mono">
                Upload your lecture notes or textbook PDFs to extract text locally and generate a high-yield summary.
              </p>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="neo-btn-accent text-xs py-2.5 px-5 inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> UPLOAD NOTES / PDF NOW
              </button>
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: FLASHCARDS (SHOWS COUNT)
          ========================================================================= */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6 animate-brutal-in">
          {cardList.length === 0 ? (
            <Card className="text-center py-12 space-y-3 border-2 border-dashed border-black bg-[#f4f1ea]">
              <Sparkles className="w-10 h-10 text-yellow-500 mx-auto" />
              <h3 className="text-sm font-display text-black uppercase">NO FLASHCARDS IN THIS DECK</h3>
              <p className="text-xs text-slate-700 max-w-md mx-auto font-mono">
                Generate active-recall practice flashcards directly from your uploaded notes.
              </p>
              <button
                onClick={() => handleGenerateFlashcards()}
                disabled={isGeneratingFlashcards || !activeNote}
                className="neo-btn-accent text-xs py-2.5 px-5 inline-flex items-center gap-2"
              >
                {isGeneratingFlashcards ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>CREATE FLASHCARDS FROM NOTES</span>
              </button>
            </Card>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-black uppercase">
                <span className="bg-yellow-300 px-2.5 py-1 border border-black shadow-[1px_1px_0px_#000]">
                  CARD {cardIdx + 1} OF {cardList.length}
                </span>
                <span className="truncate max-w-[220px] text-right font-mono">
                  [{currentCard?.topic || activeNote?.fileName || 'DECK'}]
                </span>
              </div>

              {/* 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer select-none perspective-[1000px]"
                role="button"
                tabIndex={0}
              >
                <div className={`relative min-h-[220px] transition-transform duration-300 transform-style-preserve-3d border-3 border-black shadow-[8px_8px_0px_#000] p-6 sm:p-8 flex flex-col justify-between ${
                  isFlipped ? 'bg-yellow-300' : 'bg-white'
                }`}>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {isFlipped ? 'ANSWER / EXPLANATION' : 'TERM / QUESTION'}
                    </div>
                    <div className="text-sm sm:text-base font-display font-bold text-black leading-relaxed">
                      {isFlipped ? currentCard?.back : currentCard?.front}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs text-slate-700 font-bold border-t border-black/20">
                    <span className="text-[11px] uppercase">
                      {isFlipped ? 'CLICK TO FLIP BACK ↩' : 'CLICK TO REVEAL ANSWER ↵'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIdx((cardIdx - 1 + cardList.length) % cardList.length);
                  }}
                  className="neo-btn p-3.5 min-h-[44px]"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIdx((cardIdx + 1) % cardList.length);
                    }}
                    className="flex-1 neo-btn bg-white hover:bg-black hover:text-white text-black py-3 min-h-[44px]"
                  >
                    NEXT CARD
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIdx((cardIdx + 1) % cardList.length);
                  }}
                  className="neo-btn p-3.5 min-h-[44px]"
                  title="Next Card"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: MY UPLOADS LIST (Requirement 4: Saved in IndexedDB)
          ========================================================================= */}
      {activeTab === 'uploads' && (
        <Card className="space-y-4 border-2 border-black shadow-[6px_6px_0px_#000] animate-brutal-in">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <h3 className="font-display text-sm text-black uppercase">SAVED NOTES IN INDEXEDDB</h3>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="neo-btn bg-yellow-300 text-black text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> NEW UPLOAD
            </button>
          </div>

          {savedNotes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-600 bg-[#f4f1ea] border-2 border-dashed border-black">
              NO SAVED NOTES YET. Click "Upload Notes / PDF" to get started.
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {savedNotes.map((note) => {
                const isActive = activeNote?.id === note.id;
                return (
                  <div key={note.id} className={`py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isActive ? 'bg-yellow-100 p-3 border-l-4 border-l-[#ff2d2d]' : ''
                  }`}>
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-[#ff2d2d] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-display text-black text-sm uppercase flex items-center gap-2">
                          <span>{note.fileName}</span>
                          {isActive && <span className="text-[10px] bg-[#ff2d2d] text-white px-1.5 font-mono">ACTIVE</span>}
                          {note.status === 'summarizing' && (
                            <span className="text-[10px] bg-yellow-300 border border-black text-black px-1.5 font-mono animate-pulse">
                              SUMMARIZING…
                            </span>
                          )}
                          {note.status === 'error' && (
                            <span className="text-[10px] bg-red-100 border border-red-500 text-red-700 px-1.5 font-mono">
                              ERROR
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 font-mono mt-0.5">
                          Uploaded {new Date(note.uploadedAt).toLocaleDateString()} • {note.extractedText?.split(/\s+/).filter(Boolean).length || 0} words • {note.flashcards?.length || 0} cards
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {note.status === 'error' && (
                        <button
                          onClick={() => runBackgroundSummary(note)}
                          className="neo-btn text-xs py-1.5 px-2.5 bg-red-100 hover:bg-black hover:text-white"
                          title="Retry Summary"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> RETRY
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenNote(note)}
                        className="neo-btn text-xs py-1.5 px-3"
                      >
                        OPEN
                      </button>
                      <button
                        onClick={() => {
                          setRenamingNote(note);
                          setNewNoteName(note.fileName);
                        }}
                        className="neo-btn text-xs py-1.5 px-2.5 bg-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="neo-btn text-xs py-1.5 px-2.5 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isExtracting && setUploadModalOpen(false)}
          title="UPLOAD NOTES / PDF DOCUMENT"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 font-mono text-xs text-black">
            {/* Drag and drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isExtracting && fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed border-black text-center cursor-pointer transition-colors ${
                dragActive ? 'bg-yellow-200 border-[#ff2d2d]' : 'bg-white hover:bg-yellow-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                disabled={isExtracting}
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-black" />
              <p className="text-xs font-display text-black uppercase">
                {selectedFile ? `SELECTED: ${selectedFile.name}` : 'DRAG & DROP PDF OR TEXT NOTES HERE, OR CLICK TO BROWSE'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Extracted directly in browser using pdfjs-dist. Never sends raw file to server.
              </p>
            </div>

            {/* Or Paste Text */}
            <div className="space-y-1">
              <label className="font-bold uppercase block">OR PASTE NOTES TEXT:</label>
              <textarea
                rows={4}
                value={pastedText}
                disabled={isExtracting}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste lecture notes or text here..."
                className="w-full p-2.5 border-2 border-black bg-white text-xs font-mono"
              />
            </div>

            {/* Error banner */}
            {uploadError && (
              <div className="p-3 border-2 border-[#ff2d2d] bg-red-100 text-black font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ff2d2d] shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Reading state */}
            {isExtracting && (
              <div className="p-3 border-2 border-black bg-yellow-300 font-bold flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{extractStatusText || 'Reading file…'}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="neo-btn bg-white"
                disabled={isExtracting}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleUploadAndProcess}
                disabled={isExtracting || (!selectedFile && !pastedText.trim())}
                className="neo-btn-accent flex items-center gap-2 disabled:opacity-50"
              >
                {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>PROCESS &amp; SAVE NOTE</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* RENAME UPLOAD MODAL */}
      {renamingNote && (
        <Modal
          isOpen={true}
          onClose={() => setRenamingNote(null)}
          title="RENAME NOTE"
        >
          <div className="space-y-4 font-mono text-xs text-black">
            <div className="space-y-1">
              <label className="font-bold uppercase block">NEW NOTE TITLE:</label>
              <input
                type="text"
                value={newNoteName}
                onChange={(e) => setNewNoteName(e.target.value)}
                className="w-full p-2.5 border-2 border-black bg-white text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setRenamingNote(null)}
                className="neo-btn bg-white"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleRenameNote}
                className="neo-btn-accent"
              >
                SAVE NAME
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
