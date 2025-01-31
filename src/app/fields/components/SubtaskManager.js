import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubtaskForm from './SubtaskForm';
import '../scss/subtaskManager.scss';

export default function SubtaskManager({ work, onUpdate, onWialonTrackSelect }) {
    const [subtasks, setSubtasks] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [remainingArea, setRemainingArea] = useState(work.area);
    const [isDrawingArea, setIsDrawingArea] = useState(false);
    
    // Загрузка подработ
    useEffect(() => {
        if (work.status === 'in_progress') {
            loadSubtasks();
        }
    }, [work._id]);

    const loadSubtasks = async () => {
        try {
            const response = await axios.get(`/api/fields/works/${work._id}/subtasks`);
            const loadedSubtasks = response.data.subtasks || [];
            setSubtasks(loadedSubtasks);
            
            // Вычисляем оставшуюся площадь
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
            const response = await axios.post(`/api/fields/works/${work._id}/subtasks`, formData);
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
            onWialonTrackSelect(tracks);
        }
    };

    // Если работа не в процессе, не показываем менеджер подработ
    if (work.status !== 'in_progress') {
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
                <button 
                    onClick={() => setIsCreating(true)}
                    disabled={remainingArea <= 0}
                    className="add-subtask-btn"
                >
                    Добавить подработу
                </button>
            </div>

            <div className="subtasks-list">
                {subtasks && subtasks.map(subtask => (
                    <div key={subtask._id} className="subtask-item">
                        <div className="subtask-info">
                            <h4>{subtask.name}</h4>
                            <span>Площадь: {subtask.area} га</span>
                        </div>
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