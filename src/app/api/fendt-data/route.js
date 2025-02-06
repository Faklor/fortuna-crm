import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Чтение XML файла
    const xmlFile = fs.readFileSync(path.join(process.cwd(), 'public/taskdata/ISO11783_TaskFile.xml'), 'utf8');
    const parser = new XMLParser();
    const data = parser.parse(xmlFile);

    // Обработка данных
    const processedData = {
      tasks: extractTasks(data),
      timeLogs: extractTimeLogs(data),
      deviceData: extractDeviceData(data)
    };

    return NextResponse.json(processedData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractTasks(data) {
  // Извлечение данных о задачах
  return data?.TSK?.map(task => ({
    id: task.A,
    status: task.G,
    description: task.B
  })) || [];
}

// Другие функции извлечения данных... 