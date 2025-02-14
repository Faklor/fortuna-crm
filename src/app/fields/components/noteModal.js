import { useState } from 'react';
import '../scss/noteModal.scss';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function NoteModal({ coordinates, onClose, onNoteAdded }) {
    const { data: session } = useSession();
    const [noteData, setNoteData] = useState({
        title: '',
        description: '',
        image: null,
        sendNotification: true
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setNoteData(prev => ({ ...prev, image: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Создаем FormData для отправки
            const formData = new FormData();
            formData.append('title', noteData.title);
            formData.append('description', noteData.description);
            formData.append('coordinates', JSON.stringify(coordinates));
            formData.append('season', new Date().getFullYear().toString());
            
            if (noteData.image) {
                formData.append('image', noteData.image);
            }

            // Сохраняем заметку
            const response = await axios.post('/api/notes/add', formData);
            const data = response.data;

            if (data.success) {
                // Обновляем список заметок на карте
                if (onNoteAdded) {
                    onNoteAdded(data.allNotes);
                }

                // Отправляем уведомление только если включен чекбокс
                if (noteData.sendNotification) {
                    const message = `<b>📍 Новая заметка создана</b>

👤 Создал: <code>${session?.user?.name || 'Система'}</code>
📝 Название: ${noteData.title}
${noteData.description ? `\n<b>Описание:</b>\n${noteData.description}` : ''}`;

                    if (noteData.image) {
                        const fileExtension = noteData.image.name.split('.').pop().toLowerCase();
                        const fileName = `${data.note._id}.${fileExtension}`;

                        const telegramFormData = new FormData();
                        telegramFormData.append('photo', fileName);
                        telegramFormData.append('caption', message);

                        await axios.post('/api/telegram/sendPhoto', telegramFormData);
                    } else {
                        await axios.post('/api/telegram/sendNotification', { 
                            message,
                            chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                            message_thread_id: 43,
                            parse_mode: 'HTML'
                        });
                    }
                }

                onClose();
            } else {
                throw new Error(data.error || 'Ошибка при сохранении заметки');
            }

        } catch (error) {
            console.error('Error creating note:', error);
            alert('Ошибка при создании заметки');
        }
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

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input 
                                type="checkbox"
                                checked={noteData.sendNotification}
                                onChange={(e) => setNoteData(prev => ({
                                    ...prev,
                                    sendNotification: e.target.checked
                                }))}
                            />
                            Отправить уведомление в Telegram
                        </label>
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