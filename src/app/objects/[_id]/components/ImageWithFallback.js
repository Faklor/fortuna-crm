'use client'

import NextImage from 'next/image'
import { useState } from 'react'

export default function ImageWithFallback({ icon, ...props }) {
    const [error, setError] = useState(false)

    const getImageSource = () => {
        if (!icon?.fileName) {
            return '/imgsObj/Default.png'
        }
        return `/api/uploads/${icon.fileName}`
    }

    return <NextImage
                {...props}
                src={error ? '/imgsObj/Default.png' : getImageSource()}
                alt={props.alt || 'Image'}
                onError={() => setError(true)}
                unoptimized
                priority
                className="object-image"
            />
        
    
} 