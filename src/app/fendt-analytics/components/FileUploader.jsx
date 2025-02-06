'use client';

import { useState } from 'react';
import JSZip from 'jszip';

export default function FileUploader({ onFileLoad }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processZipFile = async (file) => {
    setLoading(true);
    setError(null);
    try {
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

      // Извлекаем XML файл
      const xmlContent = await xmlFile.async('blob');
      
      // Создаем FormData для отправки на сервер
      const formData = new FormData();
      formData.append('file', xmlContent, 'TASKDATA.XML');

      // Отправляем на сервер
      const response = await fetch('/api/fendt-data/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Ошибка при обработке файла');
      }

      const data = await response.json();
      onFileLoad(data);
    } catch (err) {
      setError(err.message);
      console.error('Ошибка при обработке ZIP файла:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await processZipFile(files[0]);
    }
  };

  const handleChange = async (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      await processZipFile(files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${loading ? 'opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".zip"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading}
        />
        
        <div className="space-y-4">
          <div className="text-4xl mb-2">
            {loading ? '⏳' : '📁'}
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {loading 
                ? 'Обработка файла...' 
                : 'Перетащите ZIP файл сюда или нажмите для выбора'}
            </p>
            <p className="text-sm text-gray-500">
              Поддерживаются ZIP архивы с файлом TASKDATA.XML
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 