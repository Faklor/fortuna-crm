import { useState, useEffect } from 'react';
import '../scss/addNotes.scss'

export default function AddNotes({ onAddNote, isCreatingNote, onCancelNote }) {
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!isCreatingNote) {
            setIsActive(false);
        }
    }, [isCreatingNote]);

    const handleAddNoteClick = () => {
        const newActiveState = !isActive;
        setIsActive(newActiveState);
        onAddNote(newActiveState);
    };

    const handleCancelNote = () => {
        setIsActive(false);
        onCancelNote();
    };

    return (
        <div className="add-notes">
            {!isCreatingNote ? (
                <button 
                    className={`add-notes-btn ${isActive ? 'active' : ''}`}
                    onClick={handleAddNoteClick}
                >
                    {isActive ? 'Выберите место на карте' : 'Добавить заметку'}
                </button>
            ) : (
                <button 
                    className="cancel-note-btn"
                    onClick={handleCancelNote}
                >
                    Отменить создание
                </button>
            )}
        </div>
    )
}