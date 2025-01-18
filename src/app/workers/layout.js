import { Suspense } from 'react'
import PreLoader from '../preLoader'

export default function workersLayout({children}){
    return <main className="workers">
        <Suspense fallback={<PreLoader/>}>
        {children}
        </Suspense>
    </main>
} 
