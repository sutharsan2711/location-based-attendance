import api from '../utils/api';
import { StickyNote, StickyNoteRequest } from '../types/stickyNote';

export const stickyNoteService = {
  getAllNotes: async (category?: string): Promise<StickyNote[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const response = await api.get<StickyNote[]>('/notes', { params });
    return response.data;
  },

  createNote: async (note: StickyNoteRequest): Promise<StickyNote> => {
    const response = await api.post<StickyNote>('/notes', note);
    return response.data;
  },

  updateNote: async (id: number, note: StickyNoteRequest): Promise<StickyNote> => {
    const response = await api.put<StickyNote>(`/notes/${id}`, note);
    return response.data;
  },

  togglePin: async (id: number): Promise<StickyNote> => {
    const response = await api.patch<StickyNote>(`/notes/${id}/pin`);
    return response.data;
  },

  deleteNote: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}`);
  }
};
