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
            }, { status: 400 });
        }

        const response = await axios.get(`${WIALON_BASE_URL}`, {
            params: {
                svc: 'messages/load_interval',
                sid: sid,
                params: JSON.stringify({
                    itemId: parseInt(unitId),
                    timeFrom: parseInt(dateFrom),
                    timeTo: parseInt(dateTo),
                    flags: 0x0000,
                    flagsMask: 0x0000,
                    loadCount: 0xFFFFFFFF
                })
            }
        });

        const data = response.data;

        if (data.error) {
            throw new Error(`Wialon API error: ${data.error}`);
        }

        return NextResponse.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error fetching trips:', error);
        return NextResponse.json({
            success: false,
            error: error.response?.data?.error || error.message
        }, { status: 500 });
    }
} 