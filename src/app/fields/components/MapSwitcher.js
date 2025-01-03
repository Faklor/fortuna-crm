'use client'
import { useState } from 'react';
import '../scss/mapSwitcher.scss';

const mapTypes = [
  { id: 'satellite', name: 'Спутник', icon: '🛰️' },
  { id: 'ndvi', name: 'NDVI (вегетация)', icon: '🌱' },
  { id: 'evi', name: 'EVI (улучш. вегетация)', icon: '🌿' },
  { id: 'lst', name: 'Температура', icon: '🌡️' },
  { id: 'moisture', name: 'Влажность', icon: '💧' },
  { id: 'precipitation', name: 'Осадки', icon: '🌧️' }
];

export default function MapSwitcher({ onMapTypeChange, currentType = 'satellite' }) {
  return (
    <div className="map-switcher">
      <h2 style={{textAlign: 'center'}}>{new Date().toLocaleDateString()}</h2>
      {mapTypes.map((type) => (
        <button 
          key={type.id}
          className={`switcher-button ${currentType === type.id ? 'active' : ''} ${type.id}`}
          onClick={() => onMapTypeChange(type.id)}
        >
          <span className="icon">{type.icon}</span>
          <span className="name">{type.name}</span>
        </button>
      ))}
    </div>
  );
}