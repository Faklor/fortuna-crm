'use client'

import '../scss/workersTable.scss'

export default function WorkersTable({ workers, onEdit, onDelete, onRate }) {
    // Нормализация названия организации
    const normalizeOrganizationName = (name) => {
        return name.trim().toLowerCase();
    }

    // Группируем работников по организациям с нормализацией названий
    const groupedByOrganization = workers.reduce((acc, worker) => {
        const normalizedOrgName = normalizeOrganizationName(worker.organization);
        // Используем оригинальное название первого встреченного работника как эталонное
        const orgName = acc[normalizedOrgName] 
            ? acc[normalizedOrgName][0].organization 
            : worker.organization;
        
        if (!acc[normalizedOrgName]) {
            acc[normalizedOrgName] = [];
        }
        acc[normalizedOrgName].push(worker);
        return acc;
    }, {});

    return (
        <div className="table-container">
            {Object.entries(groupedByOrganization).map(([normalizedOrg, orgWorkers]) => (
                <div key={normalizedOrg} className="organization-section">
                    <div className="organization-header">
                        <span>{orgWorkers[0].organization}</span>
                        <span className="worker-count">
                            {orgWorkers.length} сотрудник{orgWorkers.length > 1 ? 'ов' : ''}
                        </span>
                    </div>
                    
                    {/* Группировка по должностям внутри организации */}
                    {Object.entries(
                        orgWorkers.reduce((acc, worker) => {
                            if (!acc[worker.position]) {
                                acc[worker.position] = [];
                            }
                            acc[worker.position].push(worker);
                            return acc;
                        }, {})
                    ).map(([position, positionWorkers]) => (
                        <div key={`${normalizedOrg}-${position}`} className="position-section">
                            <div className="position-header">
                                <span>{position}</span>
                                <span className="worker-count">
                                    {positionWorkers.length} сотрудник{positionWorkers.length > 1 ? 'ов' : ''}
                                </span>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ФИО</th>
                                        <th>Должность</th>
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
                                            <td>{worker.position}</td>
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
            ))}
        </div>
    )
} 