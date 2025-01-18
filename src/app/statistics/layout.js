import { Suspense } from 'react'
import PreLoader from '../preLoader'
import './scss/statistics.scss'

export default function statisticsLayout({children}){
    return <main className="statistics">
        <Suspense fallback={<PreLoader/>}>
        {children}
        </Suspense>
    </main>
} 
