'use client'
import { useEffect } from 'react';
import '../scss/imageModal.scss';

function ImageModal({ imageUrl, onClose }) {
    // Закрытие по клавише Esc
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>×</button>
                <img src={imageUrl} alt="Note" />
            </div>
        </div>
    );
}

export default ImageModal; 