'use client'

import NextImage from 'next/image'
import { useState } from 'react'

export default function ImageWithFallback({ iconData, iconContentType, ...props }) {
    const [error, setError] = useState(false)

    const getImageSource = () => {
        if (!iconData) return '/imgsObj/Default.png'
        
        try {
            const buffer = Buffer.from(iconData)
            const base64 = buffer.toString('base64')
            return `data:${iconContentType};base64,${base64}`
        } catch (e) {
            console.error('Error converting image:', e)
            return '/imgsObj/Default.png'
        }
    }

    return (
        <NextImage
            {...props}
            src={error ? '/imgsObj/Default.png' : getImageSource()}
            alt={props.alt || 'Image'}
            onError={() => setError(true)}
            unoptimized
            priority
        />
    )
} 