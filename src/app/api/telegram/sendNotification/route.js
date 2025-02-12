import { NextResponse } from 'next/server'

export async function POST(req) {
    try {
        const { message, chat_id, message_thread_id } = await req.json()
      
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

        // Убедимся, что chat_id это число
        const numericChatId = Number(chat_id)
        
        if (isNaN(numericChatId)) {
            throw new Error('Invalid chat_id format')
        }

        const bodyData = {
            chat_id: numericChatId,
            text: message,
            parse_mode: 'HTML'
        }

        if (message_thread_id) {
            bodyData.message_thread_id = message_thread_id
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
        console.error('Error in sendNotification:', {
            message: error.message,
            stack: error.stack
        })
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Unknown error'
        }, { 
            status: 500 
        })
    }
} 