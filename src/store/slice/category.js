import { createSlice } from '@reduxjs/toolkit'
import { PayloadAction } from '@reduxjs/toolkit'




const initialState = {
  category:'',
  categoryObj:'',
  visibleAddBlock:false,
  catagoryesArray:[]
}

export const counterSlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    setCategory: (state, action) => {
      state.category = action.payload
    },
    setCatagoryObj: (state, action) => {
      state.categoryObj = action.payload
    },
    setVisibleAddBlock: (state) => {
      if(state.visibleAddBlock){
        state.visibleAddBlock = false
      }
      else{
        state.visibleAddBlock = true
      }
    },
    deleteFirstItem(state){
      state.category.shift()
    },
    
    setCatagoryes(state, action){
      state.catagoryesArray = action.payload
    }
    
  }
})

export const { setCategory,setVisibleAddBlock, deleteFirstItem,setCatagoryes } = counterSlice.actions

export default counterSlice.reducer