import { NextResponse } from 'next/server'

export async function POST(req) {
    try {
        const { message, chat_id, message_thread_id, reqId } = await req.json()
      
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

        // Создаем клавиатуру с кнопками
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: "✅ Завершить заявку",
                        callback_data: `complete_request_${reqId}`
                    },
                    {
                        text: "❌ Отменить заявку",
                        callback_data: `cancel_request_${reqId}`
                    }
                ]
            ]
        }

        const bodyData = {
            chat_id: chat_id,
            text: message,
            parse_mode: 'HTML',
            message_thread_id: message_thread_id,
            reply_markup: JSON.stringify(inlineKeyboard)
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        })

        const data = await response.json()
    
        if (!response.ok) {
            console.error('Telegram API error response:', data)
            throw new Error(`Telegram API error: ${data.description}`)
        }

        return NextResponse.json({ 
            success: true, 
            data: data 
        })
    } catch (error) {
        console.error('Error in sendNotificationWithButtons:', error)
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Unknown error'
        }, { 
            status: 500 
        })
    }
} 