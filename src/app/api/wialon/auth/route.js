import { NextResponse } from 'next/server';

const WIALON_BASE_URL = 'https://wialon.damako.by/wialon/ajax.html';

export async function GET() {
    try {
        const token = process.env.WIALON_TOKEN;
        
        const response = await fetch(`${WIALON_BASE_URL}?svc=token/login&params={"token":"${token}"}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to authenticate with Wialon');
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: {
                eid: data.eid,
                sid: data.eid,
                userId: data.user.id,
                userName: data.user.nm
            }
        });

    } catch (error) {
        console.error('Wialon authentication error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
} 