'use client'

import '../scss/workersTable.scss'

export default function WorkersTable({ workers, onEdit, onDelete, onRate }) {
    // Группируем работников по должностям
    const groupedWorkers = workers.reduce((acc, worker) => {
        if (!acc[worker.position]) {
            acc[worker.position] = [];
        }
        acc[worker.position].push(worker);
        return acc;
    }, {});

    return (
        <div className="table-container">
            {Object.entries(groupedWorkers).map(([position, positionWorkers]) => (
                <div key={position} className="position-section">
                    <div className="position-header">
                        <span>{position}</span>
                        {positionWorkers.length > 1 && (
                            <span className="worker-count">
                                {positionWorkers.length} сотрудников
                            </span>
                        )}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ФИО</th>
                                <th>Телефон</th>
                                <th>Email</th>
                                <th>Рейтинг</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positionWorkers.map((worker) => (
                                <tr key={worker._id}>
                                    <td>{worker.name}</td>
                                    <td>{worker.phone}</td>
                                    <td>{worker.email}</td>
                                    <td>
                                        <div className="rating-cell">
                                            <span>{worker.rating}</span>
                                            <button 
                                                onClick={() => onRate(worker._id, 'like')}
                                                className="rate-btn like"
                                            >
                                                👍
                                            </button>
                                            <button 
                                                onClick={() => onRate(worker._id, 'dislike')}
                                                className="rate-btn dislike"
                                            >
                                                👎
                                            </button>
                                        </div>
                                    </td>
                                    <td className="action-cell">
                                        <button 
                                            className="edit-btn"
                                            onClick={() => onEdit(worker)}
                                        >
                                            Редактировать
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => onDelete(worker._id)}
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    )
} 