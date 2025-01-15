'use client'
import { useState, useRef, useEffect } from 'react';
import shp from 'shpjs';
import axios from 'axios';
import '../scss/actionMenu.scss';

export default function ActionMenu({ 
    onCreateField, 
    isCreatingField, 
    onCancelField,
    onAddNote,
    isCreatingNote,
    onCancelNote,
    season,
    dialog,
    setDialog
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);

    // Закрываем меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Обработчик для загрузки Shapefile
    const handleFileUpload = async (event) => {
        if (!event.target.files?.[0]) return;
        
        try {
            const file = event.target.files[0];
            const buffer = await file.arrayBuffer();
            
            // Парсим SHP файл
            const geojson = await shp(buffer);
            const validFeatures = geojson.features.filter(feature => 
                feature?.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0
            );
            
            if (validFeatures.length === 0) {
                setDialog({
                    isOpen: true,
                    type: 'alert',
                    title: 'Ошибка',
                    message: 'Shapefile не содержит валидных геометрических данных',
                    onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                });
                return;
            }
            
            await axios.post('/api/fields/upload-shapefile', { 
                season: season, 
                features: validFeatures 
            });
            
            setDialog({
                isOpen: true,
                type: 'alert',
                title: 'Успешно',
                message: `Файл успешно загружен! Обработано ${validFeatures.length} объектов`,
                onConfirm: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }));
                    window.location.reload(); // Перезагружаем страницу для отображения новых полей
                }
            });
        } catch (error) {
            console.error('Error:', error);
            setDialog({
                isOpen: true,
                type: 'alert',
                title: 'Ошибка',
                message: 'Ошибка при загрузке файла',
                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
            });
        }
        setIsOpen(false); 
    };

    return (
        <div className="action-menu" ref={menuRef}>
            <button 
                className={`action-menu__toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="action-menu__toggle-icon">+</span>
                <span className="action-menu__toggle-text">Действия</span>
            </button>

            {isOpen && (
                <div className="action-menu__dropdown">
                    {!isCreatingField && !isCreatingNote && (
                        <>
                            <button 
                                className="action-menu__item"
                                onClick={() => {
                                    onCreateField(true);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="icon">✏️</span>
                                Создать поле
                            </button>

                            <button 
                                className="action-menu__item"
                                onClick={() => {
                                    onAddNote(true);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="icon">📝</span>
                                Добавить заметку
                            </button>

                            <button 
                                className="action-menu__item"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <span className="icon">📁</span>
                                Загрузить Shapefile
                            </button>
                        </>
                    )}

                    {isCreatingField && (
                        <button 
                            className="action-menu__item action-menu__item--cancel"
                            onClick={onCancelField}
                        >
                            Отменить создание поля
                        </button>
                    )}

                    {isCreatingNote && (
                        <button 
                            className="action-menu__item action-menu__item--cancel"
                            onClick={onCancelNote}
                        >
                            Отменить создание заметки
                        </button>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />
        </div>
    );
} 