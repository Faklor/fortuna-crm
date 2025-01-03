'use client'
import '../scss/inspection.scss'
import { useState, useEffect } from 'react'


export default function Inspection({date, period}){


    //default
    let inspectionDate = new Date(date)
    let futureDate = new Date(inspectionDate.getFullYear() + period, inspectionDate.getMonth(), inspectionDate.getDate())
    let nowDate = new Date()

    //react
    
    //setNowDate(new Date(2013, 0, 32))

    //function
    function getNowDate(fututeDate, nowDate, inspectionDate){
        let daysSum = Math.ceil((futureDate - inspectionDate) / (1000 * 60 * 60 * 24))
        let nowSum = Math.ceil((nowDate - inspectionDate) / (1000 * 60 * 60 * 24))

        let result = Math.round(nowSum * 100 / daysSum)

        return result
    }

    //console.log(getNowDate(futureDate,nowDate,inspectionDate))
    let procent = getNowDate(futureDate,nowDate,inspectionDate)
    
    useEffect(()=>{
        if (typeof window !== 'undefined'){
            
        }
    },[])
   
    return <div className='inspection'>
        <h2>Технический осмотр ( {period} год )</h2>

        <div className='lable'>
            {/* <p>{inspectionDate.toLocaleDateString()}</p>
            <p>{futureDate.toLocaleDateString()}</p> */}
        </div>
        
        <div className='viewInspection'>
            <div className='fullLine' style={{width:'100%'}}/>
            <div className='activeLine' style={{width:`${procent}%`}}/>    
        </div>
        <div className='nowDate' style={procent<= 50?{borderLeft:'0.3em solid #4F8DE3',left:procent-1+'%'}:{borderRight:'0.3em solid #4F8DE3',left:procent -21+'%'}}>
            {/* <span>{new Date().toLocaleDateString()}</span> */}
            
        </div>
        
        
    </div>
}