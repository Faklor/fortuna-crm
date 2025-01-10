'use client'
import styles from './AnimatedLogo.module.scss'

export default function AnimatedLogo() {
    return (
        <div className={styles.logoWrapper}>
            <svg viewBox="0 0 400 200" className={styles.logo}>
                <defs>
                    <filter id="glow">
                        <feGaussianBlur result="coloredBlur" stdDeviation="4"></feGaussianBlur>
                        <feMerge>
                            <feMergeNode in="coloredBlur"></feMergeNode>
                            <feMergeNode in="SourceGraphic"></feMergeNode>
                        </feMerge>
                    </filter>
                </defs>
                <text 
                    className={`${styles.text} ${styles.mainText}`}
                    x="50%" 
                    y="40%" 
                    dy=".35em" 
                    textAnchor="middle"
                    filter="url(#glow)"
                >
                    ФОРТУНА
                </text>
                <text 
                    className={`${styles.text} ${styles.subText}`}
                    x="50%" 
                    y="65%" 
                    dy=".35em" 
                    textAnchor="middle"
                    filter="url(#glow)"
                >
                    ФЕРМЕРСКОЕ ХОЗЯЙСТВО
                </text>
            </svg>
        </div>
    )
}
