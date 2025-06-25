export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteDTO {
  title: string;
  content: string;
  category?: string;
}

export interface UpdateNoteDTO {
  title?: string;
  content?: string;
  category?: string;
}

