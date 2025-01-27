'use client'
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from 'next-auth/react'
import { ReactSVG } from "react-svg";
import UserProfile from './components/UserProfile'
import './header.scss'

export default function Header(){
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const navRef = useRef([])
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [activeNav, setActiveNav] = useState('')
    
    // Не рендерим ничего, пока сессия загружается
    if (status === 'loading') {
        return null
    }

    const navMenu = [
        {en:'tasks',ru:'Задачи',img:'/nav/task.svg'},
        {en:'objects',ru:'Объекты',img:'/nav/object.svg'},
        //{en:'workers',ru:'Работники',img:'/nav/users.svg'},
        ...(session?.user?.role === 'admin' ? [
            {en:'workers',ru:'Работники',img:'/nav/users.svg'}
        ] : []),
        {en:'warehouse',ru:'Склад',img:'/nav/warehouse.svg'},
        {en:`fields`,ru:'Поля',img:'/nav/fields.svg'},
        {en:`crop`,ru:'Севооборот',img:'/nav/crop.svg'},
        {en:`statistics`,ru:'Статистика',img:'/nav/statistics.svg'},
        // Добавляем пункт меню для админов
        ...(session?.user?.role === 'admin' ? [
            {en:'admin/accounts',ru:'Аккаунты',img:'/nav/accounts.svg'}
        ] : [])
    ]

    // Устанавливаем активный пункт меню при загрузке и изменении pathname
    useEffect(() => {
        const currentPath = pathname.split('/')[1] // Получаем текущий путь без слэша
        setActiveNav(currentPath)
    }, [pathname])

    const handleNavClick = (nav) => {
        setActiveNav(nav.en)
        
        // Добавляем query параметр для fields
        if(nav.en === 'fields') {
            router.push(`/${nav.en}?season=2025`)
        } else {
            router.push(`/${nav.en}`)
        }
        
        setIsMenuOpen(false)
    }

    return (
        <header>
            

            {/* Центральная часть с логотипом */}
            <div className="header-center">
                <div className="logo">
                    <ReactSVG 
                        src="/main/logoCrm.svg" 
                        alt="Logo"
                        beforeInjection={(svg) => {
                            svg.setAttribute('style', 'width: 60px; height: auto')
                        }}
                    />
                </div>
            </div>
            {/* UserProfile теперь слева */}
            <div className="header-left">
                <UserProfile />
            </div>

            {/* Правая часть с навигацией */}
            <div className="header-right">
                <button 
                    className={`burger-menu ${isMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
                    {navMenu.map((nav, index) => (
                        <div 
                            key={index} 
                            onClick={() => handleNavClick(nav)} 
                            className={`navItem ${activeNav === nav.en ? 'active' : ''}`}
                            ref={(el) => navRef.current[index] = el}
                        >
                            <ReactSVG src={nav.img} alt={nav.en} />
                            <p>{nav.ru}</p>
                        </div>
                    ))}
                </nav>
            </div>
        </header>
    )
}