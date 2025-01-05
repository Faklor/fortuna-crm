import { useState } from 'react';
import '../scss/noteModal.scss';

export default function NoteModal({ coordinates, onSave, onClose }) {
    const [noteData, setNoteData] = useState({
        title: '',
        description: '',
        image: null
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setNoteData(prev => ({ ...prev, image: file }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...noteData, coordinates });
    };

    return (
        <div className="note-modal-overlay">
            <div className="note-modal">
                <h3>Новая заметка</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Название</label>
                        <input 
                            type="text" 
                            value={noteData.title}
                            onChange={(e) => setNoteData(prev => ({ 
                                ...prev, 
                                title: e.target.value 
                            }))}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Описание</label>
                        <textarea 
                            value={noteData.description}
                            onChange={(e) => setNoteData(prev => ({ 
                                ...prev, 
                                description: e.target.value 
                            }))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Изображение (необязательно)</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="save-btn">
                            Сохранить
                        </button>
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 