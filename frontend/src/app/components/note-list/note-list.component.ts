import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

import { NoteItemComponent } from '../note-item/note-item.component';
import { NoteFormComponent } from '../note-form/note-form.component';
import { Note, CreateNoteDTO, UpdateNoteDTO } from '../../model/note.model';
import { NoteService } from '../../services/note.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NoteItemComponent, NoteFormComponent],
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.css'
})
export class NoteListComponent implements OnInit {
  notes$: Observable<Note[]>;
  showForm = false;
  editingNote: Note | null = null;
  searchQuery = '';
  errorMessage = '';
  private searchSubject = new Subject<string>();

  constructor(
    private noteService: NoteService,
    private authService: AuthService,
    private router: Router
  ) {
    this.notes$ = combineLatest([
      this.noteService.getAllNotes().pipe(
        catchError(error => {
          this.errorMessage = 'Failed to load notes. Please try again.';
          return of([]);
        })
      ),
      this.searchSubject.pipe(startWith(''))
    ]).pipe(
      map(([notes, searchTerm]: [Note[], string]) => {
        if (!searchTerm.trim()) {
          return notes;
        }
        return notes.filter(note =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (note.category && note.category.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
    );
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  trackByNoteId(index: number, note: Note):string{
    return note.id
  }

  onCreateNote():void{
    this.editingNote = null
    this.showForm = true
  }

  onEditNote(note : Note): void{
    this.editingNote = note
    this.showForm = true
  }

  onDeleteNote(id: string): void {
    this.noteService.deleteNote(id).subscribe(() => {
      this.refreshNotes(); // Refresh after delete
    });
  }

  onNoteSubmit(noteData : CreateNoteDTO | UpdateNoteDTO) : void{
    if(this.editingNote){
      // Update existing note
      this.noteService.updateNote(this.editingNote.id, noteData as UpdateNoteDTO).subscribe(() => {
        this.refreshNotes(); // Refresh after update
        this.closeForm();
      });
    }else{
      // Create new note
      this.noteService.createNote(noteData as CreateNoteDTO).subscribe(() => {
        this.refreshNotes(); // Refresh after create
        this.closeForm();
      });
    }
  }

  private refreshNotes(): void {
    // Trigger a refresh by emitting current search term
    this.searchSubject.next(this.searchQuery);
  }

  onCancel(): void{
    this.closeForm()
  }

  onSearch(): void{
    this.searchSubject.next(this.searchQuery); // Fixed: trigger search via subject
  }

  private closeForm():void{
    this.showForm = false
    this.editingNote = null
  }

}
