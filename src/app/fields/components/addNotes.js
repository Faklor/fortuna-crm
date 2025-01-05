import { useState } from 'react';
import '../scss/addNotes.scss'

export default function AddNotes({ onAddNote }) {
    const [isAddingNote, setIsAddingNote] = useState(false);

    const handleAddNoteClick = () => {
        setIsAddingNote(!isAddingNote);
        onAddNote(!isAddingNote);
    };

    return (
        <div className="add-notes">
            <button 
                className={`add-notes-btn ${isAddingNote ? 'active' : ''}`}
                onClick={handleAddNoteClick}
            >
                Добавить заметку
            </button>
        </div>
    )
}