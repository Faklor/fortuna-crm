'use client'
import { useState, useRef } from 'react'
import shp from 'shpjs'
import '../scss/ShapefileUploader.scss'
import axios from 'axios'

export default function ShapefileUploader({season}) {
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (event) => {
    if (!event.target.files?.[0]) return
    
    setIsLoading(true)
    try {
      const file = event.target.files[0]
      const buffer = await file.arrayBuffer()
      
      // Парсим SHP файл
      const geojson = await shp(buffer)
      const validFeatures = geojson.features.filter(feature => 
        feature?.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0
      )
      
      if (validFeatures.length === 0) {
        throw new Error('Shapefile не содержит валидных геометрических данных')
      }

      console.log(`Found ${validFeatures.length} valid features out of ${geojson.features.length} total`)
      
      await axios.post('/api/fields/upload-shapefile', { 
        season: season, 
        features: validFeatures 
      })
      
      alert(`Файл успешно загружен! Обработано ${validFeatures.length} объектов`)
    } catch (error) {
      console.error('Error:', error)
      alert('Ошибка при загрузке файла')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current.click()
  }

  return (
    <div className="shapefile-uploader">
      <button 
        className="upload-button"
        onClick={handleClick}
      >
        <span className="icon">📁</span>
        <span className="text">Загрузить поле</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
} 