import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Note } from '../../model/note.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-note-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-item.component.html',
  styleUrl: './note-item.component.css'
})
export class NoteItemComponent {
  @Input() note!: Note;
  @Output() edit = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<string>();
  
  onEdit(): void {
    this.edit.emit(this.note);
  }

  onDelete(): void {
    if(confirm("Are you sure you want to delete this note?")) {
      this.delete.emit(this.note.id);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
