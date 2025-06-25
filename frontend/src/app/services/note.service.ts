import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note, CreateNoteDTO, UpdateNoteDTO } from '../model/note.model';


@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = 'http://localhost:3000/api/notes';

  constructor(private http: HttpClient) {}

  getAllNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(this.apiUrl);
  }

  getNoteById(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.apiUrl}/${id}`);
  }

  createNote(noteDto: CreateNoteDTO): Observable<Note> {
    return this.http.post<Note>(this.apiUrl, noteDto);
  }

  updateNote(id: string, updateDto: UpdateNoteDTO): Observable<Note> {
    return this.http.patch<Note>(`${this.apiUrl}/${id}`, updateDto);
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchNotes(query: string): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUrl}?search=${query}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }
}