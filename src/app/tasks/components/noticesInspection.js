import '../scss/notices.scss'
import axios from 'axios'
import { useEffect, useState } from 'react'

export default function NoticesInspection({objects}){
    //functions
    function setNoticesInspaction(action){
        let noticesArray = []
        //default
        let nowDate = new Date()
  
        //function
        function getNowDate(fututeDate, nowDate){
          let result = Math.ceil((fututeDate - nowDate) / (1000 * 60 * 60 * 24))
          return result
        }
  
        //logic
        action.forEach((el) => {
            if(el.inspection && el.inspection.dateBegin !== ''){
                let inspectionDate = new Date(el.inspection.dateBegin)
                let futureDateValue = new Date(
                    inspectionDate.getFullYear() + Number(el.inspection.period), 
                    inspectionDate.getMonth(), 
                    inspectionDate.getDate()
                )
                let days = getNowDate(futureDateValue, nowDate)
  
                if(days <= 10 && days > 0){
                    noticesArray.push({
                        name: el.name,
                        text: `Осталось ${days} дн.`,
                        color: 'warning',
                        icon: el.catagory
                    })
                }
                else if(days < 0){
                    noticesArray.push({
                        name: el.name,
                        text: `Просрочен на ${Math.abs(days)} дн.`,
                        color: 'danger',
                        icon: el.catagory
                    })
                }
                else if(days === 0){
                    noticesArray.push({
                        name: el.name,
                        text: `Сегодня заканчивается`,
                        color: 'alert',
                        icon: el.catagory
                    })
                }
            }
        })
        
        return noticesArray
    }
    
    const [noticesInspection] = useState(setNoticesInspaction(objects))

    return (
        <div className='notices-container'>
            {noticesInspection.length !== 0 && (
                <>
                    <div className="notices-header">
                        <h2>Технический Осмотр</h2>
                        <span className="notice-count">{noticesInspection.length}</span>
                    </div>
                    <div className="notices-list">
                        {noticesInspection.map((notice, index) => (
                            <div key={index} className={`notice-item ${notice.color}`}>
                                <div className="notice-icon">{notice.icon}</div>
                                <div className="notice-content">
                                    <div className="notice-name">{notice.name}</div>
                                    <div className="notice-text">{notice.text}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}