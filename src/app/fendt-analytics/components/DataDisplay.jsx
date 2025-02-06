'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function DataDisplay({ data }) {
  // Форматирование времени для графика
  const formattedFuelData = data?.fuelConsumptionData?.map((item, index) => ({
    ...item,
    time: new Date(item.time).toLocaleTimeString(),
    id: index // добавляем id для key prop
  })) || [];

  return (
    <div className="space-y-8">
      {/* Информация об устройстве */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="font-bold mb-2">Информация об устройстве</h2>
        <div className="grid grid-cols-2 gap-2">
          <p>Модель: {data?.deviceInfo?.model || 'Н/Д'}</p>
          <p>Серийный номер: {data?.deviceInfo?.serialNumber || 'Н/Д'}</p>
          <p>Версия ПО: {data?.deviceInfo?.softwareVersion || 'Н/Д'}</p>
          <p>ID устройства: {data?.deviceInfo?.deviceId || 'Н/Д'}</p>
        </div>
      </div>

      {/* Основные показатели */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold">Общее время работы</h2>
          <p className="text-2xl">{data?.totalWorkingHours || 0} ч</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold">Средний расход топлива</h2>
          <p className="text-2xl">{data?.averageFuelConsumption || 0} л/ч</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold">Обработанная площадь</h2>
          <p className="text-2xl">{data?.totalArea || 0} га</p>
        </div>
      </div>

      {/* График */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-bold mb-4">График расхода топлива</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedFuelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="consumption" 
                stroke="#8884d8" 
                name="Расход топлива (л/ч)" 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Таблица задач */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-bold mb-4">Список задач</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Описание</th>
                <th className="px-4 py-2 text-left">Статус</th>
                <th className="px-4 py-2 text-left">Начало</th>
                <th className="px-4 py-2 text-left">Окончание</th>
                <th className="px-4 py-2 text-left">Длительность (ч)</th>
              </tr>
            </thead>
            <tbody>
              {data?.tasks?.map((task, index) => (
                <tr key={`${task.id}-${index}`} className="border-t">
                  <td className="px-4 py-2">{task.id}</td>
                  <td className="px-4 py-2">{task.description || 'Н/Д'}</td>
                  <td className="px-4 py-2">{task.status || 'Н/Д'}</td>
                  <td className="px-4 py-2">
                    {task.startTime ? new Date(task.startTime).toLocaleString() : 'Н/Д'}
                  </td>
                  <td className="px-4 py-2">
                    {task.endTime ? new Date(task.endTime).toLocaleString() : 'Н/Д'}
                  </td>
                  <td className="px-4 py-2">{task.duration || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Отладочная информация */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Отладочная информация:</h3>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 