'use client';
import './scss/page.scss'
import { useState } from 'react';
import FileUploader from './components/FileUploader';
import DataDisplay from './components/DataDisplay';

export default function FendtAnalytics() {
  const [data, setData] = useState(null);

  const handleFileLoad = (fileData) => {
    setData(fileData);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8 text-center">
        Аналитика данных Fendt
      </h1>

      {!data && <FileUploader onFileLoad={handleFileLoad} />}
      
      {data && <DataDisplay data={data} />}
    </div>
  );
} 