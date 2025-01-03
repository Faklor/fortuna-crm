import './scss/warehouse.scss'
import { Suspense } from 'react'
import PreLoader from '../preLoader'

export default function partsLayout({children}){
    return <main className="warehouse">
        <Suspense fallback={<PreLoader/>}>
        {children}
        </Suspense>
    </main>
}