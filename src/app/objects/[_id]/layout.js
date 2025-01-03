import { Suspense } from 'react'
import PreLoader from '../../preLoader'

export default function objLayout({children}){
    return <Suspense fallback={<PreLoader/>}>
        {children}
    </Suspense>
    
} 