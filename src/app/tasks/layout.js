import { Suspense } from 'react'
import PreLoader from '../preLoader'

export default function objectsLayout({children}){
    return <main className="tasks">
        <Suspense fallback={<PreLoader/>}>
        {children}
        </Suspense>
    </main>
} 
