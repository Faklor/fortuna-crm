'use client'
import { useState, useRef, useEffect } from 'react';
import shp from 'shpjs';
import axios from 'axios';
import '../scss/actionMenu.scss';
import JSZip from 'jszip';

export default function ActionMenu({ 
    onCreateField, 
    isCreatingField, 
    onCancelField,
    onAddNote,
    isCreatingNote,
    onCancelNote,
    season,
    dialog,
    setDialog,
    onShowWialonControl,
    showWialonControl,
    onFendtDataLoad,
    onRavenDataLoad,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);
    const fendtFileInputRef = useRef(null);
    const ravenFileInputRef = useRef(null);

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

    // Обработчик для загрузки Fendt данных
    const handleFendtFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setDialog({
                isOpen: true,
                type: 'loading',
                title: 'Загрузка',
                message: 'Обработка файла...'
            });

            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            
            // Ищем TASKDATA.XML в любой папке внутри ZIP
            let xmlFile = null;
            for (const [path, zipEntry] of Object.entries(zipContent.files)) {
                if (path.toUpperCase().includes('TASKDATA.XML')) {
                    xmlFile = zipEntry;
                    break;
                }
            }

            if (!xmlFile) {
                throw new Error('TASKDATA.XML не найден в ZIP архиве');
            }

            // Получаем XML как текст, а не как blob
            const xmlContent = await xmlFile.async('string');
            
            // Создаем новый blob с правильным типом
            const xmlBlob = new Blob([xmlContent], { type: 'application/xml' });
            
            // Создаем FormData для отправки на сервер
            const formData = new FormData();
            formData.append('file', xmlBlob, 'TASKDATA.XML');

            // Отправляем на сервер
            const response = await fetch('/api/fendt-data/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при обработке файла');
            }

            const data = await response.json();
            
            setDialog({
                isOpen: true,
                type: 'success',
                title: 'Успешно',
                message: 'Данные Fendt успешно загружены',
                onConfirm: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }));
                    if (onFendtDataLoad) {
                        onFendtDataLoad(data);
                    }
                }
            });

        } catch (error) {
            console.error('Error:', error);
            setDialog({
                isOpen: true,
                type: 'error',
                title: 'Ошибка',
                message: error.message || 'Ошибка при загрузке файла',
                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
            });
        }

        // Очищаем input
        if (fendtFileInputRef.current) {
            fendtFileInputRef.current.value = '';
        }
        
        setIsOpen(false);
    };

    // Обработчик для загрузки Raven данных
    const handleRavenFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setDialog({
                isOpen: true,
                type: 'loading',
                title: 'Загрузка',
                message: 'Обработка файла Raven...'
            });

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/raven-data/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при обработке файла');
            }

            const data = await response.json();
            
            setDialog({
                isOpen: true,
                type: 'success',
                title: 'Успешно',
                message: 'Данные Raven успешно загружены',
                onConfirm: () => {
                    setDialog(prev => ({ ...prev, isOpen: false }));
                    if (onRavenDataLoad) {
                        onRavenDataLoad(data);
                    }
                }
            });

        } catch (error) {
            console.error('Error:', error);
            setDialog({
                isOpen: true,
                type: 'error',
                title: 'Ошибка',
                message: error.message || 'Ошибка при загрузке файла',
                onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
            });
        }

        if (ravenFileInputRef.current) {
            ravenFileInputRef.current.value = '';
        }
        
        setIsOpen(false);
    };

    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
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

                                <button 
                                    className="action-menu__item"
                                    onClick={() => {
                                        onShowWialonControl(true);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="icon">🚗</span>
                                    Объекты Wialon
                                </button>

                                <button 
                                    className="action-menu__item"
                                    onClick={() => fendtFileInputRef.current.click()}
                                >
                                    <span className="icon">🚜</span>
                                    Загрузить работу Fendt 
                                </button>

                                <button 
                                    className="action-menu__item"
                                    onClick={() => ravenFileInputRef.current?.click()}
                                >
                                    <span className="icon">🚜</span>
                                    Загрузить работу Raven CR7
                                </button>

                            </>
                        )}

                        {showWialonControl && (
                            <button 
                                className="action-menu__item action-menu__item--cancel"
                                onClick={() => onShowWialonControl(false)}
                            >
                                Скрыть объекты Wialon
                            </button>
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
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />

            <input
                ref={fendtFileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFendtFileUpload}
                style={{ display: 'none' }}
                onClick={(e) => {
                    // Сбрасываем значение при каждом клике
                    e.target.value = '';
                }}
            />

            <input
                type="file"
                ref={ravenFileInputRef}
                style={{ display: 'none' }}
                accept=".jdp"
                onChange={handleRavenFileUpload}
            />

        </div>
    );
} 