import { createSlice } from '@reduxjs/toolkit'
import { PayloadAction } from '@reduxjs/toolkit'




const initialState = {
    socket:[],
    
}

export const counterSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocket:(state, action)=>{
        console.log(action.payload)
        state.socket - action.payload
      
      
    }
    
  }
})

export const { setSocket } = counterSlice.actions

export default counterSlice.reducer