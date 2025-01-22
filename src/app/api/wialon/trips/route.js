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

        const response = await axios.get(WIALON_BASE_URL, {
            params: {
                svc: 'messages/load_interval',
                sid: sid,
                params: JSON.stringify({
                    itemId: Number(unitId),
                    timeFrom: Number(dateFrom),
                    timeTo: Number(dateTo),
                    flags: 1,
                    flagsMask: 65281,
                    loadCount: 0xFFFFFFFF
                })
            }
        });

        if (response.data.error) {
            throw new Error(`Wialon API error: ${response.data.error}`);
        }

        const tracks = response.data.messages?.filter(msg => 
            msg.pos && msg.pos.x && msg.pos.y
        ).map(msg => ({
            lat: msg.pos.y,
            lon: msg.pos.x,
            time: msg.t,
            speed: msg.pos.s,
            course: msg.pos.c,
            altitude: msg.pos.z,
            satellites: msg.pos.sc
        })) || [];

        return NextResponse.json({
            success: true,
            tracks,
            totalMessages: response.data.count,
            period: {
                from: new Date(parseInt(dateFrom) * 1000).toLocaleString('ru-RU'),
                to: new Date(parseInt(dateTo) * 1000).toLocaleString('ru-RU')
            }
        });

    } catch (error) {
        console.error('Error in trips API:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
} 