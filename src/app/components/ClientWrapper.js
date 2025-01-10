'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import Header from '../header'
import LoadingProgress from './LoadingProgress'
//streming
import PreLoader from '../preLoader'

export default function ClientWrapper({ children }) {
    const pathname = usePathname()
    const router = useRouter()
    const containerClass = pathname === '/crop' ? 'container-wide' : 'container'
    
    // Предварительная загрузка часто используемых маршрутов
    useEffect(() => {
        // Основные маршруты вашего приложения
        router.prefetch('/crop')
        router.prefetch('/warehouse')
        router.prefetch('/objects')
        router.prefetch('/fields')
        router.prefetch('/tasks')
        // Добавьте другие важные маршруты
    }, [])
    
    return (
        <>
            <LoadingProgress />
            <div className={containerClass}>
                <Header/>
                <Suspense fallback={<PreLoader/>}>
                    {children}
                </Suspense>
            </div>
        </>
    )
} 