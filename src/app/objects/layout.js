import './scss/objects_page.scss'
import { Suspense } from 'react'
import PreLoader from '../preLoader'

export default function objectsLayout({children}){
    return (
        <main className="objects">
            <div className="objects-content">
                <Suspense fallback={<PreLoader/>}>
                    {children}
                </Suspense>
            </div>
        </main>
    )
} 