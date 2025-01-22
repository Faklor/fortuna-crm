import { NextResponse } from 'next/server';
import axios from 'axios';

const WIALON_BASE_URL = 'https://wialon.damako.by/wialon/ajax.html';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sid = searchParams.get('sid');
        const unitId = searchParams.get('unitId');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        if (!sid || !unitId || !dateFrom || !dateTo) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        const response = await axios.get(`${WIALON_BASE_URL}`, {
            params: {
                svc: 'messages/load_interval',
                sid: sid,
                params: JSON.stringify({
                    itemId: parseInt(unitId),
                    timeFrom: parseInt(dateFrom),
                    timeTo: parseInt(dateTo),
                    flags: 1,
                    flagsMask: 0xFFFFFFFF,
                    loadCount: 0xFFFFFFFF
                })
            }
        });

        return NextResponse.json({
            success: true,
            messages: response.data.messages,
            totalCount: response.data.count
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        });
    }
} 