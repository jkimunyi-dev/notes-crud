import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CreateNoteDTO, Note, UpdateNoteDTO } from "../../model/note.model";

@Component({
    selector: 'app-note-form',
    standalone : true,
    imports: [CommonModule, FormsModule],
    templateUrl: './note-form.component.html',
    styleUrl: './note-form.component.css'
})
export class NoteFormComponent implements OnInit{    
    @Input() note: Note | null = null
    @Input() isEditing = false
    @Output() noteSubmit = new EventEmitter<CreateNoteDTO | UpdateNoteDTO>
    @Output() cancel = new EventEmitter<void>

    title =''
    content = ''
    category = ''

    
    ngOnInit(): void {
        if(this.note && this.isEditing){
            this.title = this.note.title
            this.content = this.note.content
            this.category = this.note.category || ""
        }
    }

    onSubmit(): void{
        if(this.title.trim() && this.content.trim()){
            const noteData = {
                title : this.title.trim(),
                content :this.content.trim(),
                category :this.category.trim() || undefined // Fixed typo: was 'categiry'
            }

            this.noteSubmit.emit(noteData)
            this.resetForm()
        }   
    }

    onCancel(): void{
        this.cancel.emit()
        this.resetForm()
    }

    private resetForm() :void{
        this.title = ''
        this.content = ''
        this.category = ''
    }
}