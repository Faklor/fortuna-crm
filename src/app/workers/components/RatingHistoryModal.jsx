'use client'
import { useState } from 'react'
import '../scss/ratingHistoryModal.scss'

export default function RatingHistoryModal({ isOpen, onClose, ratings, workerName }) {
    if (!isOpen) return null
    console.log(ratings)

    return (
        <div className="rating-history-modal">
            <div className="rating-history-content">
                <h2>История КТУ: {workerName}</h2>
                <div className="ratings-list">
                    {ratings.sort((a, b) => new Date(b.date) - new Date(a.date)).map((rating, index) => (
                        <div key={index} className="rating-item">
                            <div className="rating-header">
                                <span className="rating-date">
                                    {new Date(rating.date).toLocaleDateString('ru-RU')}
                                </span>
                                <span className={`rating-ktu ${
                                    rating.ktu >= 1.1 ? 'excellent' :
                                    rating.ktu >= 0.9 ? 'good' :
                                    'low'
                                }`}>
                                    КТУ: {rating.ktu.toFixed(2)}
                                </span>
                            </div>
                            <div className="rating-author">
                                Установил: {rating.createdBy || 'Неизвестно'}
                            </div>
                            <div className="rating-comment">
                                {rating.comment}
                            </div>
                        </div>
                    ))}
                </div>
                <button className="close-button" onClick={onClose}>
                    Закрыть
                </button>
            </div>
        </div>
    )
} 