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

        // Сначала получаем ресурсы с правильными флагами
        const resourcesResponse = await axios.get(`${WIALON_BASE_URL}`, {
            params: {
                svc: 'core/search_items',
                sid: sid,
                params: JSON.stringify({
                    spec: {
                        itemsType: "avl_resource",
                        propType: "propitemname",
                        propName: "*",
                        propValueMask: "*",
                        sortType: "propitemname",
                    },
                    force: 1,
                    flags: 0x1 | 0x100,  // 1 - имя, базовые свойства, 256 - драйверы
                    from: 0,
                    to: 0
                })
            }
        });

        const resourcesData = resourcesResponse.data;
        //console.log('Resources response:', resourcesData.items[0].drvrs);

        if (resourcesData.error) {
            throw new Error(`Wialon API error: ${resourcesData.error}`);
        }

        // Получаем водителей напрямую из drvrs
        const drivers = [];
        if (resourcesData.items && resourcesData.items.length > 0) {
            resourcesData.items.forEach(resource => {
                if (resource.drvrs) {
                    Object.values(resource.drvrs).forEach(driver => {
                        drivers.push({
                            id: driver.id,
                            name: driver.n,
                            resourceId: resource.id,
                            resourceName: resource.nm,
                            code: driver.c || '',
                            description: driver.d || '',
                            phone: driver.p || '',
                            assignedUnit: driver.bu || null
                        });
                    });
                }
            });
        }

        //console.log('Final processed drivers:', drivers);

        return NextResponse.json({
            success: true,
            drivers: drivers
        });

    } catch (error) {
        console.error('Error fetching drivers:', error);
        return NextResponse.json({
            success: false,
            error: error.response?.data?.error || error.message
        }, { status: 500 });
    }
} 