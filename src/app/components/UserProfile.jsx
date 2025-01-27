'use client'
import { useSession, signOut } from 'next-auth/react'
import { ReactSVG } from 'react-svg'
import './userProfile.scss'

export default function UserProfile() {
    const { data: session, status } = useSession()

    //console.log('Session:', session) // Для отладки

    if (status === 'loading') {
        return <div className="user-profile loading">Загрузка...</div>
    }

    if (!session?.user) {
        return null
    }

    return (
        <div className="user-profile">
            <div className="user-info">
                <ReactSVG 
                    src="/nav/user.svg" 
                    className="user-icon"
                    beforeInjection={(svg) => {
                        svg.setAttribute('style', 'width: 24px; height: 24px')
                    }}
                />
                <div className="user-details">
                    <span className="username">{session.user.login}</span>
                    <span className="role">{session.user.role}</span>
                </div>
            </div>
            <button 
                className="logout-button"
                onClick={() => signOut({ callbackUrl: '/login' })}
            >
                <ReactSVG 
                    src="/nav/logout.svg"
                    beforeInjection={(svg) => {
                        svg.setAttribute('style', 'width: 20px; height: 20px')
                    }}
                />
            </button>
        </div>
    )
} 