import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubtaskForm from './SubtaskForm';
import '../scss/subtaskManager.scss';

// Экспортируем массив цветов, чтобы использовать его в других компонентах
export const SUBTASK_COLORS = [
    '#4CAF50', // зеленый
    '#FF0000', // красный
    '#2196F3', // синий
    '#FF9800', // оранжевый
    '#9C27B0', // фиолетовый
    '#00BCD4', // голубой
    '#FFEB3B', // желтый
    '#795548'  // коричневый
];

export default function SubtaskManager({ work, onUpdate, onWialonTrackSelect }) {
    const [subtasks, setSubtasks] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [remainingArea, setRemainingArea] = useState(work.area);
    const [isDrawingArea, setIsDrawingArea] = useState(false);
    
    // Изменяем условие загрузки подработ
    useEffect(() => {
        if (work.status === 'in_progress' || work.status === 'completed') {
            loadSubtasks();
        }
    }, [work._id]);

    const loadSubtasks = async () => {
        try {
            const response = await axios.get(`/api/fields/works/${work._id}/subtasks`);
            const loadedSubtasks = response.data.subtasks || [];
            
            // Отладочный вывод до сортировки
            console.log('Before sorting:', loadedSubtasks.map(st => ({
                date: st.plannedDate,
                id: st._id
            })));
            
            // Сортируем подработы по plannedDate
            const sortedSubtasks = [...loadedSubtasks].sort((a, b) => {
                // Преобразуем строки дат в объекты Date
                const dateA = new Date(a.plannedDate);
                const dateB = new Date(b.plannedDate);
                
                // Сортируем по убыванию (более поздние даты будут первыми)
                return dateB - dateA;
            });

            // Отладочный вывод после сортировки
            console.log('After sorting:', sortedSubtasks.map(st => ({
                date: st.plannedDate,
                id: st._id
            })));

            setSubtasks(sortedSubtasks);
            
            const allTracks = loadedSubtasks
                .map((subtask, index) => {
                    if (!subtask.tracks?.[0]?.tracks?.tracks) return null;
                    
                    return {
                        tracks: subtask.tracks[0].tracks.tracks,
                        color: SUBTASK_COLORS[index % SUBTASK_COLORS.length],
                        subtaskId: subtask._id
                    };
                })
                .filter(Boolean);

            if (typeof onWialonTrackSelect === 'function' && allTracks.length > 0) {
                onWialonTrackSelect(allTracks);
            }
            
            const completedArea = loadedSubtasks.reduce((sum, task) => 
                sum + (task.area || 0), 0
            );
            setRemainingArea(work.area - completedArea);
        } catch (error) {
            console.error('Error loading subtasks:', error);
        }
    };

    const handleCreateSubtask = async (formData) => {
        try {
            // Форматируем треки в правильную структуру с двумя вложенностями
            const tracksData = {
                tracks: [{
                    tracks: formData.tracks,
                    isWialonTrack: true
                }]
            };

            // Отправляем данные на сервер
            const response = await axios.post(`/api/fields/works/${work._id}/subtasks`, {
                ...formData,
                ...tracksData
            });
            
            if (response.data.success) {
                await loadSubtasks();
                setIsCreating(false);
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Error creating subtask:', error);
        }
    };

    const handleWialonTrackSelect = (tracks) => {
        if (typeof onWialonTrackSelect === 'function') {
            // Получаем текущие треки из существующих подработ
            const currentTracks = subtasks
                .map((subtask, index) => {
                    if (!subtask.tracks?.[0]?.tracks?.tracks) return null;
                    
                    return {
                        tracks: subtask.tracks[0].tracks.tracks,
                        color: SUBTASK_COLORS[index % SUBTASK_COLORS.length],
                        subtaskId: subtask._id
                    };
                })
                .filter(Boolean);

            // Форматируем новый трек
            const newTrack = {
                tracks: tracks.tracks,
                color: SUBTASK_COLORS[currentTracks.length % SUBTASK_COLORS.length],
                subtaskId: 'new-subtask'
            };

            // Объединяем существующие треки с новым
            const allTracks = [...currentTracks, newTrack];
            
            
            onWialonTrackSelect(allTracks);
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту подработу?')) {
            return;
        }

        try {
            const response = await axios.delete(`/api/fields/works/${work._id}/subtasks/${subtaskId}`);
            if (response.data.success) {
                await loadSubtasks();
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Error deleting subtask:', error);
            alert('Ошибка при удалении подработы');
        }
    };

    // Добавим функцию форматирования даты
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Изменяем условие рендеринга
    if (work.status !== 'in_progress' && work.status !== 'completed') {
        return null;
    }

    return (
        <div className="subtask-manager">
            <div className="subtask-header">
                <h3>Подработы</h3>
                <div className="area-info">
                    <span>Общая площадь: {work.area} га</span>
                    <span>Осталось: {remainingArea} га</span>
                </div>
                {/* Показываем кнопку добавления только для работ в процессе */}
                {work.status === 'in_progress' && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        disabled={remainingArea <= 0}
                        className="add-subtask-btn"
                    >
                        Добавить подработу
                    </button>
                )}
            </div>

            <div className="subtasks-list" style={{
                maxHeight: '500px',
                overflowY: 'auto',
                padding: '10px'
            }}>
                {subtasks && subtasks.map((subtask, index) => (
                    <div key={subtask._id} className="subtask-item">
                        <div 
                            className="subtask-color-indicator"
                            style={{ 
                                backgroundColor: SUBTASK_COLORS[index % SUBTASK_COLORS.length],
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                marginRight: '8px'
                            }}
                        />
                        <div className="subtask-info">
                            <h4>{subtask.name}</h4>
                            <div className="subtask-details">
                                <div className="subtask-date">
                                    <span>Дата: {formatDate(subtask.plannedDate)}</span>
                                </div>
                                <div className="subtask-area">
                                    <span>Площадь: {subtask.area || 'Не указана'} га</span>
                                </div>
                                <div className="subtask-workers">
                                    <span>Работники:</span>
                                    <ul>
                                        {subtask.workers.map(worker => (
                                            <li key={`${subtask._id}-worker-${worker._id}`}>
                                                {worker.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="subtask-equipment">
                                    <span>Техника:</span>
                                    <ul>
                                        {subtask.equipment.map(tech => (
                                            <li key={`${subtask._id}-tech-${tech._id}`}>
                                                {tech.name}
                                                {tech.category && ` (${tech.category})`}
                                                {tech.captureWidth && ` - ${tech.captureWidth}м`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        {/* Показываем кнопку удаления только для работ в процессе */}
                        {work.status === 'in_progress' && (
                            <div className="subtask-actions">
                                <button 
                                    onClick={() => handleDeleteSubtask(subtask._id)}
                                    className="delete-subtask-btn"
                                >
                                    Удалить
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isCreating && (
                <SubtaskForm
                    onSubmit={handleCreateSubtask}
                    onCancel={() => setIsCreating(false)}
                    maxArea={remainingArea}
                    workArea={work.processingArea}
                    onWialonTrackSelect={handleWialonTrackSelect}
                    parentWork={work}
                    preselectedWorkers={work.workers}
                    preselectedEquipment={work.equipment}
                />
            )}
        </div>
    );
}

function SubtaskItem({ subtask, onStatusChange }) {
    return (
        <div className={`subtask-item ${subtask.status}`}>
            <div className="subtask-content">
                <h4>{subtask.name}</h4>
                <p>Площадь: {subtask.area} га</p>
                <p>Статус: {subtask.status === 'in_progress' ? 'В процессе' : 'Завершено'}</p>
                {subtask.notes && <p>Примечания: {subtask.notes}</p>}
            </div>
            <div className="subtask-actions">
                {subtask.status === 'in_progress' && (
                    <button 
                        className="complete-btn"
                        onClick={() => onStatusChange('completed')}
                    >
                        Завершить
                    </button>
                )}
            </div>
        </div>
    );
}

function CreateSubtask({ workId, maxArea, onCancel, onSuccess, setIsDrawingArea }) {
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        notes: '',
        processingArea: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.processingArea) {
            alert('Необходимо выделить зону обработки');
            return;
        }

        try {
            await axios.post(`/api/works/${workId}/subtasks`, formData);
            onSuccess();
        } catch (error) {
            console.error('Error creating subtask:', error);
            alert(error.response?.data?.message || 'Ошибка при создании подработы');
        }
    };

    return (
        <form className="create-subtask-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Название:</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>
            <div className="form-group">
                <label>Площадь (га):</label>
                <input
                    type="number"
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: Number(e.target.value) })}
                    max={maxArea}
                    step="0.01"
                    required
                />
            </div>
            <div className="form-group">
                <label>Примечания:</label>
                <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
            </div>
            <div className="form-group">
                <button
                    type="button"
                    onClick={() => setIsDrawingArea(true)}
                    className={formData.processingArea ? 'area-selected' : ''}
                >
                    {formData.processingArea ? 'Зона выбрана ✓' : 'Выбрать зону обработки'}
                </button>
            </div>
            <div className="form-actions">
                <button type="submit">Создать</button>
                <button type="button" onClick={onCancel}>Отмена</button>
            </div>
        </form>
    );
} 