'use client'

import { useState } from 'react'
import '../scss/searchWorkers.scss'

export default function SearchWorkers({ onSearch }) {
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e) => {
        const value = e.target.value
        setSearchQuery(value)
        onSearch(value)
    }

    return (
        <div className="search-workers">
            <div className="search-input-wrapper">
                <input
                    type="text"
                    placeholder="Поиск по ФИО, должности или организации..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-input"
                />
                <span className="search-icon">🔍</span>
            </div>
        </div>
    )
} 