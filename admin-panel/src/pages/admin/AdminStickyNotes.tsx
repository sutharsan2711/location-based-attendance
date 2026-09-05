import React, { useState, useEffect, useMemo } from 'react';
import { stickyNoteService } from '../../services/stickyNoteService';
import { StickyNote, StickyNoteRequest, NoteColor } from '../../types/stickyNote';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import {
  Plus,
  Pin,
  Trash2,
  Edit3,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Tag,
  Palette,
  X,
  PlusCircle,
  FolderOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';

const colorThemes: Record<NoteColor, { bg: string; border: string; header: string; text: string; pin: string; badge: string }> = {
  yellow: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    header: 'bg-amber-100/60',
    text: 'text-amber-900',
    pin: 'text-amber-600 fill-amber-600',
    badge: 'bg-amber-200/60 text-amber-800'
  },
  blue: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    header: 'bg-sky-100/60',
    text: 'text-sky-900',
    pin: 'text-sky-600 fill-sky-600',
    badge: 'bg-sky-200/60 text-sky-800'
  },
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    header: 'bg-emerald-100/60',
    text: 'text-emerald-900',
    pin: 'text-emerald-600 fill-emerald-600',
    badge: 'bg-emerald-200/60 text-emerald-800'
  },
  pink: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    header: 'bg-rose-100/60',
    text: 'text-rose-900',
    pin: 'text-rose-600 fill-rose-600',
    badge: 'bg-rose-200/60 text-rose-800'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    header: 'bg-purple-100/60',
    text: 'text-purple-900',
    pin: 'text-purple-600 fill-purple-600',
    badge: 'bg-purple-200/60 text-purple-800'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    header: 'bg-orange-100/60',
    text: 'text-orange-900',
    pin: 'text-orange-600 fill-orange-600',
    badge: 'bg-orange-200/60 text-orange-800'
  },
};

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const CATEGORIES = ['All', 'General', 'Reminders', 'Operations', 'HR & Payroll', 'Ideas', 'Urgent'];

const AdminStickyNotes: React.FC = () => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<StickyNote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const [category, setCategory] = useState<string>('General');
  const [pinned, setPinned] = useState<boolean>(false);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState<string>('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await stickyNoteService.getAllNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch sticky notes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.category && n.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'All' || n.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [notes, searchQuery, selectedCategory]);

  const handleOpenModal = (noteToEdit?: StickyNote) => {
    if (noteToEdit) {
      setSelectedNote(noteToEdit);
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content || '');
      setColor((noteToEdit.color as NoteColor) || 'yellow');
      setCategory(noteToEdit.category || 'General');
      setPinned(noteToEdit.pinned || false);
      try {
        setChecklists(noteToEdit.checklistData ? JSON.parse(noteToEdit.checklistData) : []);
      } catch (e) {
        setChecklists([]);
      }
    } else {
      setSelectedNote(null);
      setTitle('');
      setContent('');
      setColor('yellow');
      setCategory(selectedCategory !== 'All' ? selectedCategory : 'General');
      setPinned(false);
      setChecklists([]);
    }
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a note title.');
      return;
    }

    const payload: StickyNoteRequest = {
      title,
      content,
      color,
      category,
      pinned,
      checklistData: checklists.length > 0 ? JSON.stringify(checklists) : undefined,
    };

    try {
      setIsSubmitting(true);
      if (selectedNote) {
        await stickyNoteService.updateNote(selectedNote.id, payload);
      } else {
        await stickyNoteService.createNote(payload);
      }
      setIsModalOpen(false);
      await fetchNotes();
    } catch (err) {
      console.error('Failed to save sticky note', err);
      alert('Failed to save note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      await stickyNoteService.togglePin(id);
      await fetchNotes();
    } catch (err) {
      console.error('Failed to toggle pin', err);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await stickyNoteService.deleteNote(id);
        await fetchNotes();
      } catch (err) {
        console.error('Failed to delete sticky note', err);
      }
    }
  };

  const handleToggleCheckItem = async (note: StickyNote, itemId: string) => {
    try {
      let items: ChecklistItem[] = [];
      if (note.checklistData) {
        items = JSON.parse(note.checklistData);
      }
      items = items.map((it) => (it.id === itemId ? { ...it, completed: !it.completed } : it));
      const payload: StickyNoteRequest = {
        title: note.title,
        content: note.content,
        color: note.color,
        category: note.category,
        pinned: note.pinned,
        checklistData: JSON.stringify(items),
      };
      await stickyNoteService.updateNote(note.id, payload);
      await fetchNotes();
    } catch (err) {
      console.error('Failed to toggle checklist item', err);
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistText.trim(),
      completed: false,
    };
    setChecklists([...checklists, newItem]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklists(checklists.filter((item) => item.id !== id));
  };

  if (loading && notes.length === 0) {
    return <Loading fullScreen message="Loading Admin Sticky Notes..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Admin Sticky Notes & Quick Board</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Sparkles className="w-3 h-3 mr-1" /> Quick Access
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pin executive reminders, operational checklists, confidential memos, and action items.
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 shadow-lg shadow-primary-500/20"
        >
          <Plus className="h-4 w-4" />
          Create Sticky Note
        </Button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Notes Masonry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredNotes.map((note) => {
          const theme = colorThemes[(note.color as NoteColor) || 'yellow'] || colorThemes.yellow;
          let checklistItems: ChecklistItem[] = [];
          if (note.checklistData) {
            try {
              checklistItems = JSON.parse(note.checklistData);
            } catch (e) {
              checklistItems = [];
            }
          }

          return (
            <div
              key={note.id}
              className={`flex flex-col justify-between rounded-3xl p-5 border shadow-sm hover:shadow-md transition-all relative group ${theme.bg} ${theme.border}`}
            >
              <div>
                {/* Note Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${theme.badge}`}>
                      {note.category || 'General'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(note.id)}
                      title={note.pinned ? 'Unpin' : 'Pin to Top'}
                      className={`p-1 rounded-full transition ${
                        note.pinned ? theme.pin : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Pin className={`w-4 h-4 ${note.pinned ? 'rotate-45' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(note)}
                      className="p-1 rounded-full text-slate-400 hover:text-blue-600 transition"
                      title="Edit Note"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-600 transition"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className={`font-bold text-base ${theme.text} mb-2 leading-snug`}>{note.title}</h3>

                {/* Content */}
                {note.content && (
                  <p className={`text-xs ${theme.text} opacity-90 whitespace-pre-wrap leading-relaxed mb-3`}>
                    {note.content}
                  </p>
                )}

                {/* Checklist Section */}
                {checklistItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/5 space-y-1.5">
                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleCheckItem(note, item.id)}
                        className="flex items-start gap-2 cursor-pointer text-xs select-none group/item"
                      >
                        {item.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 opacity-40 group-hover/item:opacity-70 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`${
                            item.completed ? 'line-through opacity-50' : 'font-medium opacity-90'
                          } ${theme.text}`}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Note Footer */}
              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[10px] opacity-60">
                <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                {checklistItems.length > 0 && (
                  <span>
                    {checklistItems.filter((i) => i.completed).length} / {checklistItems.length} Done
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700 text-base">No Sticky Notes Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first sticky note to jot down thoughts, create action checklists, or save important operational info.
            </p>
            <Button
              onClick={() => handleOpenModal()}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Note
            </Button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {selectedNote ? 'Edit Sticky Note' : 'Create Sticky Note'}
                  </h3>
                  <p className="text-xs text-slate-400">Add notes, checklist items, and tags</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Color Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pick Note Color
                </label>
                <div className="flex items-center gap-3">
                  {(Object.keys(colorThemes) as NoteColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full transition-all flex items-center justify-center ${
                        colorThemes[c].bg
                      } border-2 ${
                        color === c ? 'border-primary-600 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                    >
                      {color === c && <div className="h-2 w-2 rounded-full bg-primary-600"></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Note Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Server Maintenance Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category Tag
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pin Priority
                  </label>
                  <label className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700">Pin to Top of Wall</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Note Description / Body
                </label>
                <textarea
                  rows={3}
                  placeholder="Write your note body, instructions, or meeting points..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
              </div>

              {/* Checklist builder */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Interactive Checklists
                </label>
                <div className="space-y-2 mb-2">
                  {checklists.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{item.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a checklist step..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddChecklistItem}
                    className="text-xs py-2 px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : selectedNote ? 'Save Changes' : 'Post Note'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStickyNotes;
