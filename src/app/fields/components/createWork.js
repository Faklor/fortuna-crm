'use client'
import { useState } from 'react';
import '../scss/createWork.scss';

function CreateWork({ 
  selectedField, 
  onClose, 
  onSave,
  isDrawingProcessingArea,
  setIsDrawingProcessingArea,
  onDrawingModeChange 
}) {
  const [workData, setWorkData] = useState({
    name: '',
    type: '',
    plannedDate: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Selected Field ID:', selectedField);
    
    onSave({
      ...workData,
      fieldId: selectedField,
      processingArea: isDrawingProcessingArea ? processingArea : undefined
    });
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
            className="processing-area-btn"
            onClick={() => {
              setIsDrawingProcessingArea(!isDrawingProcessingArea);
              onDrawingModeChange(false);
            }}
          >
            {isDrawingProcessingArea ? 'Отменить выделение' : 'Выделить территорию обработки'}
          </button>

          <div className="button-group">
            <button type="submit" className="save-btn">Сохранить</button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateWork; 