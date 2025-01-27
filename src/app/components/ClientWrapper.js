'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import Header from '../header'
import LoadingProgress from './LoadingProgress'
//streming
import PreLoader from '../preLoader'

function AppContent({ children }) {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const router = useRouter()
    const containerClass = pathname === '/crop' ? 'container-wide' : 'container'
    
    useEffect(() => {
        if (status === 'unauthenticated' && pathname !== '/login') {
            router.push('/login')
        }
    }, [status, router, pathname])

    // Показываем прелоадер только если статус загрузки и не на странице логина
    if (status === 'loading' && pathname !== '/login') {
        return <PreLoader />
    }

    // Не рендерим header на странице логина
    if (pathname === '/login') {
        return children
    }

    return (
        <>
            <LoadingProgress />
            <div className={containerClass}>
                <Header session={session} />
                <Suspense fallback={<PreLoader/>}>
                    {children}
                </Suspense>
            </div>
        </>
    )
}

export default function ClientWrapper({ children }) {
    return (
        <SessionProvider>
            <AppContent>{children}</AppContent>
        </SessionProvider>
    )
} 