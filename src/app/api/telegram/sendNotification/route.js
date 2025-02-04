import { NextResponse } from 'next/server'

export async function POST(req) {
    try {
        const { message, type } = await req.json()
        const botToken = process.env.TELEGRAM_BOT_TOKEN
        
        // Выбираем ID чата в зависимости от типа уведомления
        let chatId
        switch (type) {
            case 'fields':
                chatId = process.env.TELEGRAM_CHAT_ID_FIELDS
                break
            case 'requests':
                chatId = process.env.TELEGRAM_CHAT_ID_REQUESTS
                break
            case 'inspections':
                chatId = process.env.TELEGRAM_CHAT_ID_INSPECTIONS
                break
            default:
                chatId = process.env.TELEGRAM_CHAT_ID_MAIN // Используем основной чат как fallback
        }

        if (!chatId) {
            throw new Error('Chat ID not found for the specified type')
        }
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        })

        if (!response.ok) {
            throw new Error('Failed to send telegram message')
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }
} 