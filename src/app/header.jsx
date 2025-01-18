'use client'
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ReactSVG } from "react-svg";
import './header.scss'

export default function Header(){
    const router = useRouter()
    const pathname = usePathname()
    const navRef = useRef([])
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [activeNav, setActiveNav] = useState('')
    
    const navMenu = [
        {en:'tasks',ru:'Задачи',img:'/nav/task.svg'},
        {en:'objects',ru:'Объекты',img:'/nav/object.svg'},
        {en:'workers',ru:'Работники',img:'/nav/users.svg'},
        {en:'warehouse',ru:'Склад',img:'/nav/warehouse.svg'},
        {en:`fields`,ru:'Поля',img:'/nav/fields.svg'},
        {en:`crop`,ru:'Севооборот',img:'/nav/crop.svg'},
        {en:`statistics`,ru:'Статистика',img:'/nav/statistics.svg'}
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
            {/* Логотип */}
            <div className="logo">
                <ReactSVG 
                    src="/main/logoCrm.svg" 
                    alt="Logo"
                    beforeInjection={(svg) => {
                        svg.setAttribute('style', 'width: 60px; height: auto')
                    }}
                />
            </div>

            {/* Кнопка бургер-меню для мобильной версии */}
            <button 
                className={`burger-menu ${isMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Навигационное меню */}
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
        </header>
    )
}