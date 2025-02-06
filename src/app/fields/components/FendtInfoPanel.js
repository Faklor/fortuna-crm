import React from 'react';
import styles from '../scss/FendtInfoPanel.scss';
import { getTrackColor } from '../utils/colors';

export function FendtInfoPanel({ data }) {
    if (!data) return null;

    return (
        <div className="fendt-info-panel">
            <div className="fendt-info-header">
                <h3>Информация о работах Fendt</h3>
                <div className="device-info">
                    <p><strong>Модель:</strong> {data.deviceInfo.model || 'Н/Д'}</p>
                    <p><strong>Серийный номер:</strong> {data.deviceInfo.serialNumber || 'Н/Д'}</p>
                    <p><strong>Версия ПО:</strong> {data.deviceInfo.softwareVersion || 'Н/Д'}</p>
                </div>
                <div className="summary-info">
                    <p><strong>Общее время работы:</strong> {data.totalWorkingHours || 0} ч</p>
                    <p><strong>Общая площадь:</strong> {data.totalArea || 0} га</p>
                    <p><strong>Общий расход топлива:</strong> {data.averageFuelConsumption || 0} л</p>
                    <p><strong>Средний расход на га:</strong> {
                        data.totalArea > 0 
                            ? (data.averageFuelConsumption / data.totalArea).toFixed(2) 
                            : '0'
                    } л/га</p>
                </div>
            </div>

            <div className="tasks-container">
                <h4>Задачи ({data.tasks?.length || 0})</h4>
                {data.tasks?.map((task, index) => (
                    <div 
                        key={task.id || index} 
                        className="task-card"
                        style={{ borderLeft: `4px solid ${getTrackColor(index)}` }}
                    >
                        <h5>
                            <span 
                                className="color-indicator" 
                                style={{ backgroundColor: getTrackColor(index) }}
                            />
                            {task.description || 'Без названия'}
                        </h5>
                        <div className="task-details">
                            <div className="task-main-info">
                                <p><strong>Время работы:</strong> {task.workingHours || 0} ч</p>
                                <p><strong>Обработанная площадь:</strong> {task.processedArea || 0} га</p>
                                <p><strong>Общий расход топлива:</strong> {task.fuelConsumption?.total || 0} л</p>
                                <p><strong>Расход на гектар:</strong> {task.fuelConsumption?.perHectare || 0} л/га</p>
                            </div>
                            <div className="task-time-info">
                                <p><strong>Начало:</strong> {task.startTime ? new Date(task.startTime).toLocaleString() : 'Н/Д'}</p>
                                <p><strong>Окончание:</strong> {task.endTime ? new Date(task.endTime).toLocaleString() : 'Н/Д'}</p>
                                <p><strong>Длительность:</strong> {task.duration || 0} ч</p>
                            </div>
                            <div className="track-info">
                                <p><strong>Точек трека:</strong> {task.trackPoints?.length || 0}</p>
                                {task.trackPoints?.length > 0 && (
                                    <div className="track-stats">
                                        <h6>Статистика по треку:</h6>
                                        <p><strong>Валидных точек:</strong> {
                                            task.trackPoints.filter(point => 
                                                point.coordinates?.lat !== 0 && 
                                                point.coordinates?.lng !== 0
                                            ).length
                                        }</p>
                                        <p><strong>Средняя скорость:</strong> {
                                            (task.trackPoints.reduce((sum, point) => sum + (point.speed || 0), 0) / 
                                            task.trackPoints.filter(point => point.speed).length || 0).toFixed(1)
                                        } км/ч</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getStatusText(status) {
    switch (status) {
        case 0: return 'Не начата';
        case 1: return 'В процессе';
        case 2: return 'Приостановлена';
        case 3: return 'Отменена';
        case 4: return 'Завершена';
        default: return 'Неизвестно';
    }
} 