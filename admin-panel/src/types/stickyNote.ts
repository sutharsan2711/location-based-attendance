export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export interface StickyNote {
  id: number;
  title: string;
  content: string;
  color: NoteColor | string;
  category: string;
  pinned?: boolean;
  isPinned?: boolean;
  checklistData?: string;
  checklistJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StickyNoteRequest {
  title: string;
  content?: string;
  color?: NoteColor | string;
  category?: string;
  pinned?: boolean;
  isPinned?: boolean;
  checklistData?: string;
  checklistJson?: string;
}
