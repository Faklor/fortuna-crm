'use client'
import '../scss/inspection.scss'
import { useState, useEffect } from 'react'

export default function Inspection({date, period}){
    //default
    let inspectionDate = new Date(date)
    let futureDate = new Date(inspectionDate.getFullYear() + period, inspectionDate.getMonth(), inspectionDate.getDate())
    let nowDate = new Date()

    // Функция форматирования даты
    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}.${month}.${year}`
    }

    //function
    function getNowDate(fututeDate, nowDate, inspectionDate){
        let daysSum = Math.ceil((futureDate - inspectionDate) / (1000 * 60 * 60 * 24))
        let nowSum = Math.ceil((nowDate - inspectionDate) / (1000 * 60 * 60 * 24))
        let result = Math.round(nowSum * 100 / daysSum)
        return result
    }

    let procent = getNowDate(futureDate,nowDate,inspectionDate)
    
    // Функция для определения цвета в зависимости от процента
    const getProgressColor = (percent) => {
        if (percent <= 30) return '#22c55e' // зеленый
        if (percent <= 60) return '#eab308' // желтый
        return '#ef4444' // красный
    }

    // Получаем текущий цвет
    const currentColor = getProgressColor(procent)
    
    return <div className='inspection'>
        <h2>Технический осмотр ({period} год)</h2>

        <div className='lable'>
            <p>{formatDate(inspectionDate)}</p>
            <p>{formatDate(futureDate)}</p>
        </div>
        
        <div className='viewInspection'>
            <div className='fullLine'/>
            <div 
                className='activeLine' 
                style={{
                    width: `${procent}%`,
                    background: `linear-gradient(90deg, ${currentColor} 0%, ${currentColor}dd 100%)`
                }}
            />    
        </div>

        <div className='nowDate' 
            style={{
                left: `${procent}%`,
                transform: 'translateX(-50%)',
                borderColor: currentColor
            }}
        >
            <span style={{ color: currentColor }}>{formatDate(nowDate)}</span>
        </div>
    </div>
}