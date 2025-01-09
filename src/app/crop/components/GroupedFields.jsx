'use client'
import { useMemo } from 'react'
import FieldItem from './FieldItem'

export default function GroupedFields({ fields }) {
    const groupedFields = useMemo(() => {
        // Группируем поля по названиям
        const grouped = fields.reduce((acc, field) => {
            const existingField = acc.find(f => f.name === field.name);
            
            if (existingField) {
                // Объединяем площади
                existingField.area += field.area;
                // Объединяем сезоны и сортируем их по году
                existingField.seasons = [...existingField.seasons, ...field.seasons]
                    .sort((a, b) => b.year - a.year);
                // Добавляем ID в массив связанных полей
                existingField.relatedIds.push(field.id);
            } else {
                // Создаем новую группу
                acc.push({
                    ...field,
                    relatedIds: [field.id]
                });
            }
            return acc;
        }, []);

        return grouped.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }, [fields]);

    return (
        <ul className="crop-rotation__fields-list">
            {groupedFields.map((field, fieldIndex) => (
                <FieldItem 
                    key={`field-${field.relatedIds.join('-')}-${fieldIndex}`}
                    field={field}
                />
            ))}
        </ul>
    );
} 