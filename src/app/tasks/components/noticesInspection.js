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
        function getNowDate(fututeDate, nowDate, inspectionDate){
          let result = Math.ceil((fututeDate - nowDate) / (1000 * 60 * 60 * 24))
  
          return result
        }
  
        //logic
  
        action.forEach((el,index)=>{
            if(el.inspection){
              
              if(el.inspection.dateBegin !== ''){
                
  
                let inspectionDate = new Date(el.inspection.dateBegin)
                let futureDateValue = new Date(inspectionDate.getFullYear() + Number(el.inspection.period), inspectionDate.getMonth(), inspectionDate.getDate())
                let days = getNowDate(futureDateValue, nowDate, inspectionDate)
  
                if(days <= 10 && days > 0){
                  noticesArray.push(
                    {
                      name:el.name,
                      text:`Осталось - ${days} дн.`,
                      color:'#F8FFF5'
                    }
                  )
                }
                else if(days < 0){
                  noticesArray.push(
                    {
                      name:el.name,
                      text:`Просрочен на ${Math.abs(days)} дн.`,
                      color:'#FFDDDD'
                    }
                  )
                }
                else if(days === 0){
                  noticesArray.push(
                    {
                      name:el.name,
                      text:`Сегодня заканчивается`,
                      color:'#FFF9E5'
                    }
                  )
                }
                
                
              }
            }
  
        })
  
        
        
        return noticesArray
        
    }
    
    const [noticesInspection] = useState(setNoticesInspaction(objects))


    return <div  className='notices'>
        {noticesInspection.length !== 0?<h2>Технический Осмотр</h2>:''}

        {noticesInspection.map((el,index)=>{
            return <div key={index} className='inspection' style={{backgroundColor:el.color}}>  
                <p>{el.name + ' ' + el.text}</p>
                
            </div>
        })}
    </div>
}