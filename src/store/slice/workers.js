import { createSlice } from '@reduxjs/toolkit'
import { PayloadAction } from '@reduxjs/toolkit'




const initialState = {
  workers:[]
}

export const counterSlice = createSlice({
  name: 'workesrs',
  initialState,
  reducers: {
    setWorkers: (state, action) => {
      state.workers = (action.payload).sort()
    }, 
    
  }
})

export const { setWorkers } = counterSlice.actions

export default counterSlice.reducer