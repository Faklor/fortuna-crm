import React, { useState } from 'react';
import WialonControl from './WialonControl';
import { point, polygon, booleanPointInPolygon, area } from '@turf/turf';

export default function SubtaskForm({ onSubmit, onCancel, maxArea, workArea, onWialonTrackSelect }) {
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        description: '',
        processingArea: null
    });
    const [showWialonControl, setShowWialonControl] = useState(false);
    const [useWialon, setUseWialon] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.area) {
            alert('Заполните обязательные поля');
            return;
        }

        const area = parseFloat(formData.area);
        if (isNaN(area) || area <= 0) {
            alert('Площадь должна быть положительным числом');
            return;
        }

        if (area > maxArea) {
            alert(`Площадь не может превышать ${maxArea} га`);
            return;
        }

        onSubmit(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleWialonTrackSelect = (tracks) => {
        if (typeof onWialonTrackSelect === 'function') {
            onWialonTrackSelect(tracks);
        }
    };

    const isPointInPolygon = (pointCoords, polygonCoords) => {
        const pt = point(pointCoords);
        const poly = polygon([polygonCoords]);
        return booleanPointInPolygon(pt, poly);
    };

    const calculateArea = (polygon) => {
        try {
            const calculatedArea = area(polygon);
            return Math.round((calculatedArea / 10000) * 100) / 100;
        } catch (error) {
            console.error('Error calculating area:', error);
            return 0;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="subtask-form">
            <div className="form-group">
                <label htmlFor="name">Название подработы*:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="area">Площадь (га)*:</label>
                <input
                    type="number"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    min="0.01"
                    max={maxArea}
                    step="0.01"
                    required
                />
                <small>Максимальная площадь: {maxArea} га</small>
            </div>

            <div className="form-group">
                <label htmlFor="description">Описание:</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                />
            </div>

            <div className="form-group area-selection">
                <label>Территория обработки:</label>
                <div className="area-selection-controls">
                    <button
                        type="button"
                        className={`area-btn ${!useWialon ? 'active' : ''}`}
                        onClick={() => {
                            setUseWialon(false);
                            setShowWialonControl(false);
                            if (typeof onWialonTrackSelect === 'function') {
                                onWialonTrackSelect([]);
                            }
                        }}
                    >
                        Ручной ввод
                    </button>
                    <button
                        type="button"
                        className={`area-btn ${useWialon ? 'active' : ''}`}
                        onClick={() => {
                            setUseWialon(true);
                            setShowWialonControl(true);
                        }}
                    >
                        По Wialon
                    </button>
                </div>

                {showWialonControl && (
                    <WialonControl 
                        onSelectTrack={handleWialonTrackSelect}
                        onClose={() => {
                            setShowWialonControl(false);
                            setUseWialon(false);
                            if (typeof onWialonTrackSelect === 'function') {
                                onWialonTrackSelect([]);
                            }
                        }}
                        workArea={workArea}
                    />
                )}

                {formData.processingArea && (
                    <div className="form-group">
                        <label>Площадь обработки:</label>
                        <span>{formData.area} га</span>
                    </div>
                )}
            </div>

            <div className="form-actions">
                <button type="submit" className="submit-btn">Создать</button>
                <button type="button" onClick={onCancel} className="cancel-btn">Отмена</button>
            </div>
        </form>
    );
} 