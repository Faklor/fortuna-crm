'use client'
import { useState, useEffect } from 'react';
import '../scss/createWork.scss';

// Определяем функцию вне компонента
const handleProcessingAreaUpdate = (setWorkData, coordinates) => {
    
    setWorkData(prev => ({
        ...prev,
        processingArea: {
            type: 'Polygon',
            coordinates: [coordinates]
        }
    }));
};

function CreateWork({ 
    onClose, 
    onSave, 
    processingArea,
    isDrawingProcessingArea, 
    setIsDrawingProcessingArea 
}) {
    const [workData, setWorkData] = useState({
        name: '',
        type: '',
        fieldId: '',
        plannedDate: '',
        description: '',
        processingArea: processingArea
    });

    useEffect(() => {
        if (processingArea) {
           
            setWorkData(prev => ({
                ...prev,
                processingArea: processingArea
            }));
        }
    }, [processingArea]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!workData.processingArea) {
            alert('Необходимо выделить область обработки');
            return;
        }

       
        onSave(workData);
    };

    return (
        <div className="create-work-modal">
            <div className="create-work-content">
                <h2>Создание работы</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Название работы:</label>
                        <input
                            type="text"
                            value={workData.name}
                            onChange={(e) => setWorkData({ ...workData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Тип работы:</label>
                        <select
                            value={workData.type}
                            onChange={(e) => setWorkData({ ...workData, type: e.target.value })}
                            required
                        >
                            <option value="">Выберите тип работы</option>
                            <option value="plowing">Вспашка</option>
                            <option value="seeding">Посев</option>
                            <option value="fertilizing">Внесение удобрений</option>
                            <option value="spraying">Опрыскивание</option>
                            <option value="harvesting">Уборка</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Планируемая дата:</label>
                        <input
                            type="date"
                            value={workData.plannedDate}
                            onChange={(e) => setWorkData({ ...workData, plannedDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Описание:</label>
                        <textarea
                            value={workData.description}
                            onChange={(e) => setWorkData({ ...workData, description: e.target.value })}
                        />
                    </div>

                    <button 
                        type="button"
                        onClick={() => setIsDrawingProcessingArea(true)}
                        className={workData.processingArea ? 'area-selected' : ''}
                    >
                        {workData.processingArea ? 'Область выделена ✓' : 'Выделить территорию обработки'}
                    </button>

                    <div className="button-group">
                        <button type="submit">Сохранить</button>
                        <button type="button" onClick={onClose}>Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Экспортируем функцию и компонент
export { handleProcessingAreaUpdate };
export default CreateWork; 