import { Suspense } from 'react'
import PreLoader from '../preLoader'

export default function fieldsLayout({children}){
    return <>
        <Suspense fallback={<PreLoader/>}>
        {children}
        </Suspense>
    </>
} 
