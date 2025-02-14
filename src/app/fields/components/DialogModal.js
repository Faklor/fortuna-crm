'use client'
import { useEffect, useState } from 'react';
import '../scss/dialogModal.scss';

export default function DialogModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    type = 'alert', // 'alert', 'prompt', 'confirm'
    defaultValue = '',
    confirmText = 'OK',
    cancelText = 'Отмена',
    showNotificationCheckbox,
    defaultNotificationState
}) {
    
    const [inputValue, setInputValue] = useState(defaultValue || '');
    const [sendNotification, setSendNotification] = useState(defaultNotificationState || false);

    useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (type === 'prompt') {
            onConfirm(inputValue);
        } else {
            onConfirm(sendNotification);
        }
    };

    return (
        <div className="dialog-modal-overlay">
            <div className="dialog-modal">
                <h3 className="dialog-modal__title">{title}</h3>
                <div className="dialog-modal__content">
                    {message && <p className="dialog-modal__message">{message}</p>}
                    {type === 'prompt' && (
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="dialog-modal__input"
                            autoFocus
                        />
                    )}
                    {showNotificationCheckbox && (
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={sendNotification}
                                onChange={(e) => setSendNotification(e.target.checked)}
                            />
                            Отправить уведомление в Telegram
                        </label>
                    )}
                </div>
                <div className="dialog-modal__actions">
                    {(type === 'prompt' || type === 'confirm') && (
                        <button 
                            className="dialog-modal__button dialog-modal__button--secondary"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button 
                        className="dialog-modal__button dialog-modal__button--primary"
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
} 