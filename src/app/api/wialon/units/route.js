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

        const wialonParams = {
            spec: {
                itemsType: "avl_unit",
                propName: "sys_name",
                propValueMask: "*",
                sortType: "sys_name"
            },
            force: 1,
            flags: 4294967295,
            from: 0,
            to: 0
        };

        const response = await axios.get(`${WIALON_BASE_URL}`, {
            params: {
                svc: 'core/search_items',
                sid: sid,
                params: JSON.stringify(wialonParams)
            }
        });

        const data = response.data;

        if (data.error) {
            throw new Error(`Wialon API error: ${data.error}`);
        }

        return NextResponse.json({
            success: true,
            units: data.items || []
        });

    } catch (error) {
        console.error('Error fetching units:', error);
        return NextResponse.json({
            success: false,
            error: error.response?.data?.error || error.message
        }, { status: 500 });
    }
} 