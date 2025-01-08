import { Suspense } from 'react'
import PreLoader from '../preLoader'

export default function cropLayout({children}){
    return <>
        <Suspense fallback={<PreLoader/>}>
        {children}
        </Suspense>
    </>
} 
