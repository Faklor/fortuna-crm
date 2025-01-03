import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  objects:[],
}

export const counterSlice = createSlice({
  name: 'objects',
  initialState,
  reducers: {
    setObjects: (state, action) => {
      if(action.payload.length !== 0){
        state.objects = [...action.payload].sort((a, b) => a.name.localeCompare(b.name))
      }
      
    },
    addObject:(state, action)=>{
      state.objects.push(action.payload)
      //state.objects = state.objects.sort((a, b) => a.name.localeCompare(b.name))

    },
    filterCategory(state, action){
      const filter = state.objects.filter(el=>el.catagory === action.payload)

      action.payload !== 'All'?state.searchObjects = filter:state.searchObjects = state.objects  
      
      
    } 
    
  }
})

export const { setObjects,addObject,filterCategory } = counterSlice.actions

export default counterSlice.reducer