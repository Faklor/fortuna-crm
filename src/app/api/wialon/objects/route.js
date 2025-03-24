import { NextResponse } from 'next/server';
import axios from 'axios';

const WIALON_BASE_URL = 'https://wialon.damako.by/wialon/ajax.html';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sid = searchParams.get('sid');

        if (!sid) {
            return NextResponse.json({
                success: false,
                error: 'Session ID is required'
            }, { status: 400 });
        }

        // Получаем все юниты с их текущими позициями
        const response = await axios.get(`${WIALON_BASE_URL}`, {
            params: {
                svc: 'core/search_items',
                sid: sid,
                params: JSON.stringify({
                    spec: {
                        itemsType: "avl_unit",
                        propName: "sys_name",
                        propValueMask: "*",
                        sortType: "sys_name"
                    },
                    force: 1,
                    flags: 1025, // Флаги для получения позиции и базовой информации
                    from: 0,
                    to: 0
                })
            }
        });

        const data = response.data;

        if (data.error) {
            throw new Error(`Wialon API error: ${data.error}`);
        }

        // Преобразуем данные в нужный формат
        const objects = data.items.map(item => ({
            id: item.id,
            name: item.nm,
            lat: item.pos?.y,
            lon: item.pos?.x,
            speed: item.pos?.s || 0,
            lastUpdate: item.pos?.t,
            sensors: item.sens
        }));

        return NextResponse.json({
            success: true,
            items: objects
        });

    } catch (error) {
        console.error('Error fetching Wialon objects:', error);
        return NextResponse.json({
            success: false,
            error: error.response?.data?.error || error.message
        }, { status: 500 });
    }
} 