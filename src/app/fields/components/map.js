'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Polygon, FeatureGroup, useMap, WMSTileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import ShowField from './showField'
import axios from 'axios'
import 'leaflet-draw/dist/leaflet.draw.css'
import '../scss/map.scss'
import * as turf from '@turf/turf'
import { useSearchParams } from 'next/navigation'
import L from 'leaflet'
import AddNotes from './addNotes'
import NoteModal from './noteModal'
import CreateField from './createField'
import ImageModal from './ImageModal'
import { Buffer } from 'buffer';
import Image from 'next/image';
import ActionMenu from './ActionMenu'
import CoordinatesDisplay from './CoordinatesDisplay'
import DialogModal from './DialogModal'
import WialonControl from './WialonControl'
import { SUBTASK_COLORS } from './SubtaskManager'
import { FendtLayer } from './FendtLayer'
import { FendtInfoPanel } from './FendtInfoPanel'
import { RavenLayer } from './RavenLayer'
import { RavenInfoPanel } from './RavenInfoPanel'
import { useSession } from 'next-auth/react'

function DrawingControl({ 
  selectedFieldData, 
  onSubFieldCreate, 
  subFields, 
  isProcessingArea, 
  onProcessingAreaCreate,
  dialog,
  setDialog
}) {
  const map = useMap();
  let snappedPoint = null;
  // Функция очистки индикатора магнита
  const clearSnapIndicator = () => {
    const indicator = document.querySelector('.snap-indicator');
    if (indicator) {
      indicator.remove(); // Полностью удаляем элемент из DOM
    }
  };

  const handleMouseMove = (e, parentCoords) => {
    const latLng = e.latlng;
    if (!latLng?.lat || !latLng?.lng) return;

    // Проверяем структуру parentCoords
    if (!Array.isArray(parentCoords)) {
      console.error('Invalid parentCoords structure:', parentCoords);
      return;
    }

    // Убедимся, что полигон замкнут
    let coords = [...parentCoords];
    if (!arraysEqual(coords[0], coords[coords.length - 1])) {
      coords.push([...coords[0]]);
    }

    const currentPoint = [latLng.lng, latLng.lat];
    const SNAP_THRESHOLD = 20;
    
    try {
      const mousePoint = turf.point(currentPoint);
      let minDistance = Infinity;
      let closestSegment = null;

      // Проверяем каждую точку coords
      for (let i = 0; i < coords.length - 1; i++) {
        const start = coords[i];
        const end = coords[i + 1];
        
        if (!Array.isArray(start) || !Array.isArray(end) || 
            start.length !== 2 || end.length !== 2) {
          console.error('Invalid coordinates at index', i, ':', start, end);
          continue;
        }

        const line = turf.lineString([start, end]);
        const distance = turf.pointToLineDistance(mousePoint, line, { units: 'meters' });

        if (distance < minDistance) {
          minDistance = distance;
          closestSegment = { start, end, distance };
        }
      }

      if (closestSegment && closestSegment.distance < SNAP_THRESHOLD) {
        const line = turf.lineString([closestSegment.start, closestSegment.end]);
        const nearestPoint = turf.nearestPointOnLine(line, mousePoint);
        
        const offsetDistance = 0.00001;
        // Используем замкнутый массив координат для создания полигона
        const polygonCenter = turf.center(turf.polygon([coords]));
        
        const dx = polygonCenter.geometry.coordinates[0] - nearestPoint.geometry.coordinates[0];
        const dy = polygonCenter.geometry.coordinates[1] - nearestPoint.geometry.coordinates[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return;

        snappedPoint = [
          nearestPoint.geometry.coordinates[0] + (dx / length) * offsetDistance,
          nearestPoint.geometry.coordinates[1] + (dy / length) * offsetDistance
        ];

        // Визуальный индикатор
        let indicator = document.querySelector('.snap-indicator');
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.className = 'snap-indicator';
          document.body.appendChild(indicator);
        }

        const point = map.latLngToContainerPoint([snappedPoint[1], snappedPoint[0]]);
        indicator.style.cssText = `
          position: absolute;
          left: ${point.x}px;
          top: ${point.y}px;
          width: 10px;
          height: 10px;
          background-color: #4F8DE3;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          pointer-events: none;
          box-shadow: 0 0 5px rgba(255,0,0,0.5);
        `;
        indicator.style.display = 'block';

        // Обновляем позицию курсора
        if (e.layer && e.layer._snappedPoint) {
          e.layer._snappedPoint.lat = snappedPoint[1];
          e.layer._snappedPoint.lng = snappedPoint[0];
        }

      } else {
        // Убираем индикатор если нет привязки
        const indicator = document.querySelector('.snap-indicator');
        if (indicator) {
          indicator.style.display = 'none';
        }
        snappedPoint = null;
      }

    } catch (error) {
      console.error('Error in handleMouseMove:', error);
      console.error('Coordinates:', coords);
      clearSnapIndicator();
    }
  };

  const swapCoordinates = coords => coords.map(point => [point[1], point[0]]);
  
  const checkPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > point[1]) !== (yj > point[1]))
          && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const checkPolygonsIntersect = (poly1, poly2) => {
    if (!poly2?.coordinates || !Array.isArray(poly2.coordinates)) return false;

    const normalizedPoly2 = poly2.coordinates;
    const normalizedPoly1 = poly1; // poly1 уже в формате [[lat, lng], ...]

    const lineIntersect = (p1, p2, p3, p4) => {
      const det = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p4[0] - p3[0]) * (p2[1] - p1[1]);
      if (det === 0) return false;
      
      const lambda = ((p4[1] - p3[1]) * (p4[0] - p1[0]) + (p3[0] - p4[0]) * (p4[1] - p1[1])) / det;
      const gamma = ((p1[1] - p2[1]) * (p4[0] - p1[0]) + (p2[0] - p1[0]) * (p4[1] - p1[1])) / det;
      
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    };

    for (let i = 0; i < normalizedPoly1.length; i++) {
      for (let j = 0; j < normalizedPoly2.length; j++) {
        const p1 = normalizedPoly1[i];
        const p2 = normalizedPoly1[(i + 1) % normalizedPoly1.length];
        const p3 = normalizedPoly2[j];
        const p4 = normalizedPoly2[(j + 1) % normalizedPoly2.length];
        
        if (lineIntersect(p1, p2, p3, p4)) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <FeatureGroup>
      <Polygon 
        positions={swapCoordinates(selectedFieldData.coordinates[0])}
        pathOptions={{ 
          opacity: 1,
          fillOpacity: 0.1,
          color: 'red',
          weight: 3,
          className: 'parent-polygon-mask' 
        }}
      />
      
      <EditControl
        position='topright'
        onCreated={e => {
          if (e.layerType !== 'polygon' || !e.layer.getLatLngs) return;

          try {
            let coordinates = e.layer.getLatLngs()[0]
              .map(latLng => [latLng.lat, latLng.lng]);
            
            // Убедимся, что полигон замкнут
            if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
              coordinates.push(coordinates[0]);
            }
            
            const allPointsInside = coordinates.every(point => 
              checkPointInPolygon([point[1], point[0]], selectedFieldData.coordinates[0])
            );

            if (!allPointsInside) {
              e.layer.setStyle({
                color: 'red',
                fillColor: 'red',
                fillOpacity: 0.2,
                weight: 2
              });
              
              setTimeout(() => {
                setDialog({
                  isOpen: true,
                  type: 'alert',
                  title: 'Ошибка',
                  message: 'Полигон должен находиться внутри границ родительского поля',
                  onConfirm: () => {
                    setDialog({ ...dialog, isOpen: false });
                    e.layer.remove();
                  }
                });
              }, 100);
              return;
            }

            // Если это территория обработки
            if (isProcessingArea) {
              onProcessingAreaCreate(coordinates);
            } else {
              // Существующая логика для подполей
              const hasIntersection = subFields.some(subField => 
                subField?.coordinates && checkPolygonsIntersect(coordinates, subField)
              );

              if (hasIntersection) {
                e.layer.setStyle({
                  color: 'red',
                  fillColor: 'red',
                  fillOpacity: 0.2,
                  weight: 2
                });
                
                setTimeout(() => {
                  setDialog({
                    isOpen: true,
                    type: 'alert',
                    title: 'Уведомление',
                    message: 'Подполя не должны пересекаться между собой',
                    onConfirm: () => {
                      setDialog({ ...dialog, isOpen: false });
                      e.layer.remove();
                    }
                  });
                }, 100);
                return;
              }

              onSubFieldCreate(coordinates);
            }
          } catch (error) {
            console.error('Error:', error);
            e.layer.remove();
          }
        }}
        onDrawStart={() => {
          const parentCoords = selectedFieldData.coordinates[0];
          const moveHandler = e => handleMouseMove(e, parentCoords);
          
          map.on('mousemove', moveHandler);
          
          map.on('click', (clickEvent) => {
            if (snappedPoint) {
              // ... existing snap handling code ...
            }
          });
          
          map.once('draw:drawstop', () => {
            map.off('mousemove', moveHandler);
            map.off('click');
            clearSnapIndicator();
            snappedPoint = null;
          });
        }}
        draw={{
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: 'Полигоны не должны пересекаться!'
            },
            shapeOptions: {
              color: 'green'
            },
            icon: new L.DivIcon({
              className: 'custom-draw-marker',
              iconSize: new L.Point(8, 8)
            })
          }
        }}
        edit={{
          edit: false,
          remove: false
        }}
      />
    </FeatureGroup>
  );
}

// Вспомогательная функция для сравнения массивов
const arraysEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((val, index) => Math.abs(val - b[index]) < 1e-10);
};

function Map({ fields, currentSeason }) {
  const [selectedField, setSelectedField] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [subFields, setSubFields] = useState([]);
  const [showFieldVisible, setShowFieldVisible] = useState(false);
  const [key, setKey] = useState(0);
  const defaultCenter = [53.22351039786457, 25.813576095323324];
  const [subFieldsVersion, setSubFieldsVersion] = useState(0);
  const [selectedSubField, setSelectedSubField] = useState(null);
  const searchParams = useSearchParams();
  const season = searchParams.get('season') || currentSeason;
  const [isEditingMainField, setIsEditingMainField] = useState(false);
  const [isEditingSubField, setIsEditingSubField] = useState(false);
  const [editingSubFieldId, setEditingSubFieldId] = useState(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [notes, setNotes] = useState([]);
  const [processingArea, setProcessingArea] = useState(null);
  const [isDrawingProcessingArea, setIsDrawingProcessingArea] = useState(false);
  const [fieldWorks, setFieldWorks] = useState([]);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingField, setIsCreatingField] = useState(false);
  const [isDrawingField, setIsDrawingField] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCreateWorkModalOpen, setIsCreateWorkModalOpen] = useState(false);
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: '',
    onConfirm: null,
    onClose: null,
    defaultValue: '',
    showNotificationCheckbox: false,
    defaultNotificationState: false
  });
  const [wialonTracks, setWialonTracks] = useState([]);
  const [showWialonControl, setShowWialonControl] = useState(false);
  const [subtaskTracks, setSubtaskTracks] = useState(null);
  const [fendtData, setFendtData] = useState(null);
  const [ravenData, setRavenData] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Здесь можно добавить логику загрузки полей с учетом сезона
    if (season) {
      // Обновить поля в соответствии с выбранным сезоном
    }
  }, [season]);

  const getMapLayer = () => {
    const baseSatelliteLayer = (
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        opacity={1}
      />
    );

    return baseSatelliteLayer;
  };

  useEffect(() => {
    const loadAllSubFields = async () => {
      try {
        const response = await axios.get('/api/fields/subFields/get', {
          params: { season: season }
        });
        if (response.data.success) {
          setSubFields(response.data.subFields);
        }
      } catch (error) {
        console.error('Error loading subfields:', error);
      }
    };

    if (season) {
      loadAllSubFields();
    }
  }, [season, subFieldsVersion]);

  // При смене сезона сбрасываем выбранное поле и подполя
  useEffect(() => {
    setSelectedField(null);
    setSelectedSubField(null);
    setShowFieldVisible(false);
    setIsDrawingMode(false);
  }, [season]);

  const handleFieldSelect = (fieldId) => {
    // Если выбирается другое поле, сбрасываем все режимы редактирования
    if (fieldId !== selectedField) {
        setIsEditingMainField(false);
        setIsDrawingMode(false);
        setSelectedSubField(null);
        setProcessingArea(null);
        setIsCreateWorkModalOpen(false);
    }
    
    setSelectedField(fieldId);
    setShowFieldVisible(true);
    setSelectedSubField(null);
  };

  const handleSubFieldSelect = (subFieldId, parentId) => {
    setSelectedSubField(subFieldId);
    if (parentId) {
      setSelectedField(parentId);
      setShowFieldVisible(true);
    }
  };

  const handleSubFieldCreate = async (coordinates) => {
    try {
    //   // Убедимся, что полигон замкнут
    //   if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
    //     coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
    //     coordinates.push(coordinates[0]);
    // }

    // // Запрашиваем название подполя через prompt
    // const subFieldName = window.prompt('Введите название подполя:', `Подполе ${subFields.length + 1}`);
    
    // // Если пользователь нажал "Отмена", используем дефолтное название
    // const finalName = subFieldName === null ? `Подполе ${subFields.length + 1}` : subFieldName.trim();

    // const response = await axios.post('/api/fields/subFields/create', {
    //     parentId: selectedField,
    //     coordinates: coordinates,
    //     properties: {
    //         Name: finalName,
    //         parentId: selectedField
    //     }
    // });
        setDialog({
            isOpen: true,
            type: 'prompt',
            title: 'Создание подполя',
            message: 'Введите название подполя:',
            defaultValue: `Подполе ${subFields.length + 1}`,
            onConfirm: async (subFieldName) => {
                setDialog({ ...dialog, isOpen: false });
                const finalName = subFieldName.trim() || `Подполе ${subFields.length + 1}`;
                
                const response = await axios.post('/api/fields/subFields/create', {
                    parentId: selectedField,
                    coordinates: coordinates,
                    properties: {
                        Name: finalName,
                        parentId: selectedField
                    }
                });

                if (response.data.success) {
                    const subFieldsResponse = await axios.get('/api/fields/subFields/get');
                    
                    if (subFieldsResponse.data.success) {
                        await new Promise(resolve => {
                            setSubFields(subFieldsResponse.data.subFields);
                            setSubFieldsVersion(prev => prev + 1);
                            resolve();
                        });
                        
                        setIsDrawingMode(false);
                        
                        setTimeout(() => {
                            setKey(prevKey => prevKey + 1);
                            setIsDrawingMode(true);
                        }, 100);
                        setSubFields(prev => [...prev, response.data.data]);
                        setSubFieldsVersion(prev => prev + 1);
                        setIsDrawingMode(false);
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating subfield:', error);
        setDialog({
            isOpen: true,
            type: 'alert',
            title: 'Ошибка',
            message: 'Ошибка при создании подполя',
            onConfirm: () => setDialog({ ...dialog, isOpen: false })
        });
    }
  };

  const handleCloseShowField = () => {
    setShowFieldVisible(false);
    setSelectedField(null);
    setSelectedSubField(null);
    setIsDrawingMode(false);
    setProcessingArea(null);
  };

  useEffect(() => {
    if (L.drawLocal) {
      // Переопределяем тексты для всех действий редактирования
      L.drawLocal.edit = {
        ...L.drawLocal.edit,
        toolbar: {
          actions: {
            save: {
              title: 'Сохранить изменения',
              text: 'Сохранить'
            },
            cancel: {
              title: 'Отменить изменения',
              text: 'Отмена'
            },
            clearAll: {
              title: 'Очистить все',
              text: 'Очистить все'
            }
          },
          buttons: {
            edit: 'Редактировать слои',
            editDisabled: 'Нет слоев для редактирования',
            remove: 'Удалить слои',
            removeDisabled: 'Нет слоев для удаления'
          }
        }
      };
    }
  }, []);

  // Обработчик клика по карте
  const handleMapClick = (e) => {
    if (isAddingNote) {
        // Получаем координаты клика
        const coordinates = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
        };
        setSelectedPoint(coordinates);
        setIsCreatingNote(true); // Устанавливаем в true при клике по карте
    }
  };

  // Обновляем функцию загрузки заметок
  const fetchNotes = useCallback(async () => {
    try {
        const response = await fetch(`/api/notes?season=${season}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.notes)) {
            setNotes(data.notes);
        } else {
            console.error('Unexpected response format:', data);
            setNotes([]);
        }
    } catch (error) {
        console.error('Error fetching notes:', error);
        setNotes([]);
    }
  }, [season]);

  // Используем useEffect с fetchNotes
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Создаем кастомную иконку для заметок
  const noteIcon = L.divIcon({
    className: 'note-marker',
    html: '<div class="marker-inner"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });

  // Также обновим обработчик удаления заметки
  const handleDeleteNote = async (noteId) => {
    const deletedNote = notes.find(note => note._id === noteId);

    setDialog({
        isOpen: true,
        type: 'confirm',
        title: 'Подтверждение',
        message: 'Вы уверены, что хотите удалить эту заметку?',
        showNotificationCheckbox: true,
        defaultNotificationState: false,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        onConfirm: async (sendNotification) => {
            try {
                const response = await fetch('/api/notes/delete', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ noteId })
                });

                const data = await response.json();

                if (data.success) {
                    if (sendNotification) {
                        const message = `<b>🗑️ Заметка удалена</b>

👤 Удалил: <code>${session?.user?.name || 'Система'}</code>
📝 Название: ${deletedNote.title}
${deletedNote.description ? `\n<b>Описание удаленной заметки:</b>\n${deletedNote.description}` : ''}
${deletedNote.image ? '\n🖼 Было прикреплено изображение' : ''}`;

                        await axios.post('/api/telegram/sendNotification', { 
                            message,
                            chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                            message_thread_id: 43,
                            parse_mode: 'HTML'
                        });
                    }

                    setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
                    setDialog({
                        isOpen: true,
                        type: 'alert',
                        title: 'Успешно',
                        message: 'Заметка успешно удалена',
                        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                    });
                } else {
                    throw new Error(data.error || 'Ошибка при удалении заметки');
                }
            } catch (error) {
                console.error('Error deleting note:', error);
                setDialog({
                    isOpen: true,
                    type: 'alert',
                    title: 'Ошибка',
                    message: 'Ошибка при удалении заметки',
                    onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                });
            }
        },
        onClose: () => setDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleProcessingAreaCreate = (coordinates) => {
    // Преобразуем координаты в правильный формат GeoJSON
    const formattedCoordinates = {
        type: 'Polygon',
        coordinates: [coordinates.map(coord => [coord[1], coord[0]])] // Меняем местами lat и lng
    };
    
    setProcessingArea(formattedCoordinates);
    setIsDrawingProcessingArea(false);
  };

  // Загрузка работ при выборе поля
  useEffect(() => {
    const loadFieldWorks = async () => {
        if (selectedField) {
            try {
                const response = await axios.get(`/api/fields/works/getByField/${selectedField}`);
                if (response.data) {
                    setFieldWorks(response.data);
                }
            } catch (error) {
                console.error('Error loading field works:', error);
            }
        }
    };

    loadFieldWorks();
  }, [selectedField]);

  const handleWorkStatusUpdate = (workId, newStatus) => {
    // Обновляем отображение работ на карте
    setFieldWorks(prevWorks => 
        prevWorks.map(work => 
            work._id === workId 
                ? { ...work, status: newStatus }
                : work
        )
    );
  };

  // Обработчик выбора работы
  const handleWorkSelect = (area) => {
    setProcessingArea(area);
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setIsCreatingNote(false);
    setSelectedPoint(null);
    setIsAddingNote(false);
  };

  // Обработчик создания нового поля
  const handleFieldCreate = async (coordinates) => {
    try {
        setDialog({
            isOpen: true,
            type: 'prompt',
            title: 'Создание поля',
            message: 'Введите название поля:',
            defaultValue: `Поле ${new Date().toLocaleDateString()}`,
            onConfirm: async (fieldName) => {
                setDialog({ ...dialog, isOpen: false });
                if (!fieldName) return;
                
                const response = await fetch('/api/fields/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: fieldName,
                        coordinates: coordinates,
                        season: season || new Date().getFullYear().toString()
                    })
                });

                const data = await response.json();

                if (data.success) {
                    window.location.reload();
                } else {
                    throw new Error(data.error || 'Failed to create field');
                }
            }
        });
    } catch (error) {
        setDialog({
            isOpen: true,
            type: 'alert',
            title: 'Ошибка',
            message: 'Ошибка при создании поля',
            onConfirm: () => setDialog({ ...dialog, isOpen: false })
        });
    }
  };

  const getImageSource = (icon) => {
    if (!icon?.fileName) {
        return '/imgsNotes/Default.png';
    }
    
    // Используем новый путь для получения изображений через API роут
    return `/api/uploads/notes/${icon.fileName}`;
  };

  const handleWialonTrackSelect = (tracks) => {
    setWialonTracks(tracks || []);
  };

  const renderWialonTrack = (segments) => {
    if (!segments || !Array.isArray(segments)) return null;

    return segments.map((segment, segmentIndex) => {
        if (!Array.isArray(segment)) return null;

        // Создаем массив координат для линии трека
        const trackCoords = segment.map(point => {
            if (!point || typeof point.lat === 'undefined' || typeof point.lon === 'undefined') {
                return null;
            }
            return [point.lat, point.lon];
        }).filter(coord => coord !== null);

        if (trackCoords.length < 2) return null;

        // Определяем цвет линии в зависимости от типа сегмента
        const isWorking = segment[0]?.isWorking;
        const color = isWorking ? '#4CAF50' : '#9e9e9e';

        // Находим центральную точку сегмента для размещения метки
        const centerIndex = Math.floor(trackCoords.length / 2);
        const centerPoint = trackCoords[centerIndex];

        return (
            <React.Fragment key={`segment-${segmentIndex}`}>
                <Polyline
                    positions={trackCoords}
                    pathOptions={{
                        color: color,
                        weight: 3,
                        opacity: 0.7
                    }}
                />
                <Marker
                    position={centerPoint}
                    icon={L.divIcon({
                        className: 'segment-label',
                        html: `<div class="segment-number ${isWorking ? 'working' : 'non-working'}">
                                ${segmentIndex + 1}
                              </div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    })}
                />
            </React.Fragment>
        );
    });
  };

  // Обработчик получения треков
  const handleSubtaskTracksSelect = useCallback((tracks) => {
    if (tracks && tracks.length > 0) {
    }
    setSubtaskTracks(tracks);
  }, []);

  // Обработчик загрузки данных Fendt
  const handleFendtDataLoad = useCallback((data) => {
    console.log('Received Fendt data:', data);
    setFendtData(data);
  }, []);

  // Добавляем обработчик загрузки данных Raven
  const handleRavenDataLoad = useCallback((data) => {
    console.log('Received Raven data:', data);
    setRavenData(data);
  }, []);

  return (
    <div className="map-container">
      <style jsx global>{`
        .ndvi-layer {
          filter: contrast(200%) brightness(150%) saturate(200%) !important;
          mix-blend-mode: multiply !important;
        }
      `}</style>

      <style jsx global>{`
        .leaflet-editing-icon {
          border-radius: 50% !important;
          width: 12px !important;
          height: 12px !important;
          margin-left: -6px !important;
          margin-top: -6px !important;
          background-color: white !important;
          border: 2px solid #FFF !important;
        }
      `}</style>

      <style jsx global>{`
        .track-number {
            background-color: white;
            border: 2px solid #4CAF50;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #4CAF50;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>

      <MapContainer 
        key={key}
        center={defaultCenter} 
        zoom={13} 
        className='map'
        onClick={handleMapClick}
      >
        {getMapLayer()}
        
        {/* Добавляем компонент отображения координат */}
        <CoordinatesDisplay />

        {/* Отображение основных полей */}
        {fields?.map((field, index) => (
          !isEditingMainField || field._id !== selectedField ? (
            <Polygon 
              key={index} 
              positions={field.coordinates[0].map(point => [point[1], point[0]])}
              eventHandlers={{
                click: () => handleFieldSelect(field._id)
              }}
              pathOptions={{
                fillColor: field._id === selectedField ? '#FFF' : '#FFF',
                fillOpacity: field._id === selectedField ? 0.2 : 0.2,
                weight: field._id === selectedField ? 3 : 2,
                color: field._id === selectedField ? '#F74F73' : '#FFF'
              }}
            />
          ) : null
        ))}

        {/* Отображение подполей */}
        {!isEditingSubField && subFields.map((subField, index) => (
          <Polygon 
            key={`subfield-${index}`}
            positions={subField.coordinates}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                handleSubFieldSelect(subField._id, subField.properties.parentId);
              }
            }}
            pathOptions={{ 
              color: subField._id === selectedSubField ? '#FFF' : '#A9C4FF',
              fillColor: subField._id === selectedSubField ? '#FFF' : '#427EFF',
              fillOpacity: subField._id === selectedSubField ? 0.6 : 0.4,
              weight: subField._id === selectedSubField ? 3 : 2
            }}
          />
        ))}

        {/* Отображаем ТОЛЬКО выбранную зону работы */}
        {processingArea && (
          <Polygon 
            positions={processingArea.coordinates[0].map(coord => [coord[1], coord[0]])}
            pathOptions={{ 
              color: '#FFFFFF',
              weight: 2,
              opacity: 0.8,
              fillColor: '#FFFFFF',
              fillOpacity: 0.3
            }}
          />
        )}

        {/* Компонент DrawingControl */}
        {(isDrawingMode || isDrawingProcessingArea) && selectedField && (
          <DrawingControl 
            selectedFieldData={fields.find(f => f._id === selectedField)}
            onSubFieldCreate={handleSubFieldCreate}
            subFields={subFields}
            isProcessingArea={isDrawingProcessingArea}
            onProcessingAreaCreate={handleProcessingAreaCreate}
            dialog={dialog}
            setDialog={setDialog}
          />
        )}

        {/* Добавляем обработчик клика на карту */}
        <MapEvents onClick={handleMapClick} />

        {/* Если есть выбранная точка, показываем маркер */}
        {selectedPoint && (
          <Marker 
            position={[selectedPoint.lat, selectedPoint.lng]}
            icon={new L.Icon({
              iconUrl: '/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41]
            })}
          />
        )}

        {/* Отображаем заметки на карте */}
        {Array.isArray(notes) && notes.map(note => (
          <Marker
            key={note._id}
            position={[note.coordinates.lat, note.coordinates.lng]}
            icon={noteIcon}
          >
            <Popup>
              <div className="note-popup">
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                {note.icon?.fileName && (
                    <div 
                        className="note-image-container"
                        style={{
                            width: '200px',
                            height: '150px',
                            position: 'relative',
                            backgroundImage: `url(${getImageSource(note.icon)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '10px'
                        }}
                        onClick={() => setSelectedImage(getImageSource(note.icon))}
                    />
                )}
                <button 
                  onClick={() => handleDeleteNote(note._id)}
                  style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                  }}
                >
                  Удалить заметку
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Компонент для рисования нового поля */}
        {isDrawingField && (
          <FeatureGroup>
            <EditControl
              position='topright'
              onCreated={e => {
                if (e.layerType !== 'polygon') return;
                const coordinates = e.layer.getLatLngs()[0]
                  .map(latLng => [latLng.lng, latLng.lat]);
                
                if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
                    coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
                    coordinates.push(coordinates[0]);
                }
                handleFieldCreate(coordinates);
              }}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  drawError: {
                    color: '#e1e100',
                    message: 'Полигоны не должны пересекаться!'
                  },
                  shapeOptions: {
                    color: '#FFF',
                    fillColor: '#FFF',
                    fillOpacity: 0.2,
                    weight: 2
                  }
                }
              }}
              edit={{
                edit: false,
                remove: false
              }}
            />
          </FeatureGroup>
        )}

        {/* Добавляем отображение треков подзадач */}
        {subtaskTracks && subtaskTracks.length > 0 && (
            <FeatureGroup>
                {subtaskTracks.map((track) => {
                    // Получаем индекс подработы для соответствия цветам в SubtaskManager
                    const subtaskIndex = subtaskTracks.findIndex(t => 
                        t.originalSubtaskId === track.originalSubtaskId
                    );
                    
                    return (
                        <Polyline
                            key={track.subtaskId}
                            positions={track.coordinates}
                            pathOptions={{
                                // Используем те же цвета и тот же порядок, что и в SubtaskManager
                                color: SUBTASK_COLORS[subtaskIndex % SUBTASK_COLORS.length],
                                weight: 3,
                                opacity: 0.8
                            }}
                        />
                    );
                })}
            </FeatureGroup>
        )}

        {/* Отрисовка трека Wialon */}
        {wialonTracks && renderWialonTrack(wialonTracks)}

        {/* Слой с данными Fendt */}
        {fendtData && <FendtLayer data={fendtData} />}

        {/* Слой с данными Raven */}
        {ravenData && <RavenLayer data={ravenData} />}
      </MapContainer>

      {/* Компонент ShowField */}
      {showFieldVisible && (
        <ShowField 
          setShowFieldVisible={handleCloseShowField}
          selectedField={selectedField}
          isDrawingMode={isDrawingMode}
          onDrawingModeChange={setIsDrawingMode}
          subFieldsVersion={subFieldsVersion}
          onSubFieldSelect={handleSubFieldSelect}
          selectedSubField={selectedSubField}
          subFields={subFields}
          setSubFields={setSubFields}
          isEditingMainField={isEditingMainField}
          setIsEditingMainField={setIsEditingMainField}
          isEditingSubField={isEditingSubField}
          setIsEditingSubField={setIsEditingSubField}
          editingSubFieldId={editingSubFieldId}
          setEditingSubFieldId={setEditingSubFieldId}
          isDrawingProcessingArea={isDrawingProcessingArea}
          setIsDrawingProcessingArea={setIsDrawingProcessingArea}
          processingArea={processingArea}
          setProcessingArea={setProcessingArea}
          onWorkStatusUpdate={handleWorkStatusUpdate}
          onWorkSelect={handleWorkSelect}
          fieldWorks={fieldWorks}
          isCreateWorkModalOpen={isCreateWorkModalOpen}
          setIsCreateWorkModalOpen={setIsCreateWorkModalOpen}
          dialog={dialog}
          setDialog={setDialog}
          onWialonTrackSelect={handleWialonTrackSelect}
          onSubtaskTracksSelect={handleSubtaskTracksSelect}
          onFendtDataLoad={handleFendtDataLoad}
          onRavenDataLoad={handleRavenDataLoad}
        />
      )}

      {/* Модальное окно для добавления информации о заметке */}
      {selectedPoint && isCreatingNote && (
        <NoteModal 
          coordinates={selectedPoint}
          onClose={handleCloseModal}
          onNoteAdded={(newNotes) => setNotes(newNotes)}
        />
      )}

      {/* Добавляем компонент создания поля */}
      <ActionMenu 
        onCreateField={(status) => setIsDrawingField(status)}
        isCreatingField={isCreatingField}
        onCancelField={() => {
            setIsDrawingField(false);
            setIsCreatingField(false);
        }}
        onAddNote={(status) => setIsAddingNote(status)}
        isCreatingNote={isCreatingNote}
        onCancelNote={handleCloseModal}
        season={season}
        dialog={dialog}
        setDialog={setDialog}
        onShowWialonControl={(status) => setShowWialonControl(status)}
        showWialonControl={showWialonControl}
        onFendtDataLoad={handleFendtDataLoad}
        onRavenDataLoad={handleRavenDataLoad}
      />

      {/* Модальное окно для просмотра изображения */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {showWialonControl && (
        <WialonControl 
            onSelectTrack={handleWialonTrackSelect} 
            onClose={() => setShowWialonControl(false)}
            fields={fields}
        />
      )}

      {dialog && <DialogModal
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        defaultValue={dialog.defaultValue}
        showNotificationCheckbox={dialog.showNotificationCheckbox}
        defaultNotificationState={dialog.defaultNotificationState}
      />}

      {/* Добавляем панель информации */}
      {fendtData && <FendtInfoPanel data={fendtData} />}

      {/* Добавляем панель информации Raven */}
      {ravenData && <RavenInfoPanel data={ravenData} />}
    </div>
  );
}

// Вспомогательный компонент для обработки событий карты
function MapEvents({ onClick }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    map.on('click', onClick);
    
    return () => {
      map.off('click', onClick);
    };
  }, [map, onClick]);
  
  return null;
}

export default Map;

