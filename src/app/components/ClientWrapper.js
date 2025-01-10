'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import PreLoader from '../preLoader'
import Header from '../header'

export default function ClientWrapper({ children }) {
    const pathname = usePathname()
    const containerClass = pathname === '/crop' ? 'container-wide' : 'container'
    
    return (
        <div className={containerClass}>
            <Header/>
            <Suspense fallback={<PreLoader/>}>
                {children}
            </Suspense>
        </div>
    )
} 