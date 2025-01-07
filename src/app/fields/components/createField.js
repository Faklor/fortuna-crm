import { useState } from 'react';
import '../scss/createField.scss'

export default function CreateField({ onCreateField, isCreating, onCancel }) {
    const [isActive, setIsActive] = useState(false);

    const handleCreateFieldClick = () => {
        const newActiveState = !isActive;
        setIsActive(newActiveState);
        onCreateField(newActiveState);
    };

    const handleCancel = () => {
        setIsActive(false);
        onCancel();
    };

    return (
        <div className="create-field">
            {!isCreating ? (
                <button 
                    className={`create-field-btn ${isActive ? 'active' : ''}`}
                    onClick={handleCreateFieldClick}
                >
                    {isActive ? 'Нарисуйте поле на карте' : 'Создать поле'}
                </button>
            ) : (
                <button 
                    className="cancel-create-btn"
                    onClick={handleCancel}
                >
                    Отменить создание
                </button>
            )}
        </div>
    );
} 