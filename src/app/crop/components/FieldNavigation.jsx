'use client'
import { memo, useState } from 'react'
import '../scss/fieldNavigation.scss'

const FieldNavigation = memo(({ fields, onFieldSelect }) => {
    const [activeField, setActiveField] = useState(null);

    const scrollToField = (fieldName) => {
        const element = document.querySelector(`[data-field-name="${fieldName}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveField(fieldName);
            
            // Находим заголовок поля и добавляем к нему класс active
            const header = element.querySelector('.crop-rotation__field-header');
            if (header) {
                header.classList.add('active');
                setTimeout(() => {
                    header.classList.remove('active');
                }, 2000);
            }
        }
        if (onFieldSelect) onFieldSelect(fieldName);
    };

    return (
        <div className="crop-rotation__navigation">
            <div className="crop-rotation__navigation-header">
                Список полей
            </div>
            <div className="crop-rotation__navigation-list">
                {fields.map((field, index) => (
                    <button
                        key={`nav-${field.id}-${index}`}
                        className={`crop-rotation__navigation-item ${activeField === field.name ? 'active' : ''}`}
                        onClick={() => scrollToField(field.name)}
                    >
                        <span className="crop-rotation__navigation-name">
                            {field.name}
                        </span>
                        <span className="crop-rotation__navigation-area">
                            {field.area.toFixed(2)} га
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
});

export default FieldNavigation; 