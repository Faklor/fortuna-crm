'use client'
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '../scss/coordinatesDisplay.scss';

function CoordinatesDisplay() {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleContextMenu = (e) => {
      e.originalEvent.preventDefault(); // Предотвращаем стандартное контекстное меню
      
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      
      const popup = L.popup({
        className: 'coordinates-popup',
        closeButton: false,
        offset: [0, -5]
      })
        .setLatLng(e.latlng)
        .setContent(`
          <div class="coordinates-content">
            <div class="coordinates-title">Координаты</div>
            <div class="coordinates-value">
              <div class="coordinate-row">
                <span>Широта: ${lat}</span>
                <button class="copy-btn" data-value="${lat}">
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M16 1H4C3 1 2 2 2 3v14h2V3h12V1zm3 4H8C7 5 6 6 6 7v14c0 1 1 2 2 2h11c1 0 2-1 2-2V7c0-1-1-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
              <div class="coordinate-row">
                <span>Долгота: ${lng}</span>
                <button class="copy-btn" data-value="${lng}">
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M16 1H4C3 1 2 2 2 3v14h2V3h12V1zm3 4H8C7 5 6 6 6 7v14c0 1 1 2 2 2h11c1 0 2-1 2-2V7c0-1-1-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
              <button class="copy-both-btn" data-lat="${lat}" data-lng="${lng}">
                Копировать обе координаты
              </button>
            </div>
          </div>
        `)
        .openOn(map);

      // Добавляем обработчики для кнопок копирования
      setTimeout(() => {
        const copyButtons = document.querySelectorAll('.copy-btn');
        const copyBothButton = document.querySelector('.copy-both-btn');

        copyButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = button.getAttribute('data-value');
            navigator.clipboard.writeText(value).then(() => {
              button.classList.add('copied');
              setTimeout(() => button.classList.remove('copied'), 1000);
            });
          });
        });

        copyBothButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const lat = copyBothButton.getAttribute('data-lat');
          const lng = copyBothButton.getAttribute('data-lng');
          navigator.clipboard.writeText(`${lat}, ${lng}`).then(() => {
            copyBothButton.classList.add('copied');
            setTimeout(() => copyBothButton.classList.remove('copied'), 1000);
          });
        });
      }, 0);

      // Закрываем popup через 10 секунд (увеличили время, чтобы успеть скопировать)
      setTimeout(() => {
        map.closePopup(popup);
      }, 10000);
    };

    map.on('contextmenu', handleContextMenu);
    
    return () => {
      map.off('contextmenu', handleContextMenu);
    };
  }, [map]);
  
  return null;
}

export default CoordinatesDisplay; 