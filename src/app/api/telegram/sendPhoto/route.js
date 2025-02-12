import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const photoName = formData.get('photo');
        const caption = formData.get('caption');

        if (!photoName) {
            throw new Error('Photo name is required');
        }

        // Изменяем путь к папке с изображениями на uploads/imgsNotes
        const imagePath = path.join(process.cwd(), 'uploads', 'imgsNotes', photoName);
        
        // Проверяем существование файла
        if (!fs.existsSync(imagePath)) {
            throw new Error(`File not found: ${imagePath}`);
        }

        // Создаем form-data для отправки в Telegram
        const telegramForm = new FormData();
        
        // Читаем файл и создаем Blob
        const fileBuffer = fs.readFileSync(imagePath);
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
        
        telegramForm.append('photo', blob, photoName);
        telegramForm.append('caption', caption);
        telegramForm.append('chat_id', process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM);
        telegramForm.append('message_thread_id', '43');
        telegramForm.append('parse_mode', 'HTML');

        // Отправляем запрос в Telegram
        const response = await axios.post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
            telegramForm,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        return NextResponse.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error sending photo to Telegram:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message,
                details: {
                    name: error.name,
                    code: error.code,
                    stack: error.stack
                }
            },
            { status: 500 }
        );
    }
} 