import '../scss/sortingOptions.scss'
import { useState, useEffect } from 'react'

export default function SortingOptions({ originalParts, visibleParts, setVisibleParts }) {
    // Собираем уникальные значения для каждого типа сортировки
    const [sortOptions, setSortOptions] = useState({
        storageIds: [],
        manufacturers: [],
        contacts: [],
        objects: []
    })

    useEffect(() => {
        // Собираем все уникальные значения из оригинального массива частей
        const options = originalParts.reduce((acc, part) => {
            // Места хранения
            if (part.storageId && !acc.storageIds.includes(part.storageId)) {
                acc.storageIds.push(part.storageId)
            }
            // Производители
            if (part.manufacturer && !acc.manufacturers.includes(part.manufacturer)) {
                acc.manufacturers.push(part.manufacturer)
            }
            // Поставщики
            if (part.contact?.name && !acc.contacts.includes(part.contact.name)) {
                acc.contacts.push(part.contact.name)
            }
            // Объекты из привязок
            if (part.bindingObj?.length) {
                part.bindingObj.forEach(obj => {
                    if (obj.name && !acc.objects.includes(obj.name)) {
                        acc.objects.push(obj.name)
                    }
                })
            }
            return acc
        }, {
            storageIds: [],
            manufacturers: [],
            contacts: [],
            objects: []
        })

        // Сортируем все массивы
        options.storageIds.sort()
        options.manufacturers.sort()
        options.contacts.sort()
        options.objects.sort()

        setSortOptions(options)
    }, [originalParts])

    const handleSort = (type, value) => {
        if (!value) {
            setVisibleParts([...originalParts]) // Сброс к исходному списку
            return
        }

        const sortedParts = originalParts.filter(part => {
            switch (type) {
                case 'storageId':
                    return part.storageId === value
                case 'manufacturer':
                    return part.manufacturer === value
                case 'contact':
                    return part.contact?.name === value
                case 'object':
                    return part.bindingObj?.some(obj => obj.name === value)
                default:
                    return true
            }
        })

        setVisibleParts(sortedParts)
    }

    return (
        <div className="sorting-options">
            <select 
                onChange={(e) => handleSort('storageId', e.target.value)}
                className="sort-select"
            >
                <option value="">📍 Место хранения</option>
                {sortOptions.storageIds.map((id, index) => (
                    <option key={index} value={id}>
                        {id}
                    </option>
                ))}
            </select>

            <select 
                onChange={(e) => handleSort('manufacturer', e.target.value)}
                className="sort-select"
            >
                <option value="">🏭 Производитель</option>
                {sortOptions.manufacturers.map((manufacturer, index) => (
                    <option key={index} value={manufacturer}>
                        {manufacturer}
                    </option>
                ))}
            </select>

            <select 
                onChange={(e) => handleSort('contact', e.target.value)}
                className="sort-select"
            >
                <option value="">👥 Поставщик</option>
                {sortOptions.contacts.map((contact, index) => (
                    <option key={index} value={contact}>
                        {contact}
                    </option>
                ))}
            </select>

            <select 
                onChange={(e) => handleSort('object', e.target.value)}
                className="sort-select"
            >
                <option value="">🔗 Привязка к объекту</option>
                {sortOptions.objects.map((object, index) => (
                    <option key={index} value={object}>
                        {object}
                    </option>
                ))}
            </select>
        </div>
    )
} 