'use client'
import NextNProgress from 'nextjs-progressbar'

export default function LoadingProgress() {
    return (
        <NextNProgress
            color="#354759"
            startPosition={0.3}
            stopDelayMs={200}
            height={3}
            showOnShallow={true}
            options={{ 
                showSpinner: false,
                easing: 'ease',
                speed: 500,
            }}
        />
    )
} 