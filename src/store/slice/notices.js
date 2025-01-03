import { createSlice } from '@reduxjs/toolkit'
import { PayloadAction } from '@reduxjs/toolkit'




const initialState = {
    notices:[],
    noticesInspection:[],
    
}

export const counterSlice = createSlice({
  name: 'notices',
  initialState,
  reducers: {
    setNoticesInspaction:(state, action)=>{

      let noticesArray = []
      //default
      let nowDate = new Date()

      //function
      function getNowDate(fututeDate, nowDate, inspectionDate){
        //let daysSum = Math.ceil((fututeDate - inspectionDate) / (1000 * 60 * 60 * 24))
        //let nowSum = Math.ceil((nowDate - inspectionDate) / (1000 * 60 * 60 * 24))

        //let result = Math.round(nowSum * 100 / daysSum)
        let result = Math.ceil((fututeDate - nowDate) / (1000 * 60 * 60 * 24))

        return result
      }

      //logic

      action.payload.forEach((el,index)=>{
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

      
      state.noticesInspection = noticesArray
      
    }
    
  }
})

export const { setNoticesInspaction } = counterSlice.actions

export default counterSlice.reducer