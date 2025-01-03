import { createSlice } from '@reduxjs/toolkit'
import { PayloadAction } from '@reduxjs/toolkit'




const initialState = {
  parts:[],
  searchParts:[],
  sendVisible:false
}

export const counterSlice = createSlice({
  name: 'parts',
  initialState,
  reducers: {
    setParts: (state, action) => {
      state.parts = action.payload
      //---sort----
      let sortABC = action.payload.sort((a, b) => a.name.localeCompare(b.name));
      let sortCountABC = sortABC.filter(item => item.count > 0).concat(sortABC.filter(item => item.count === 0))
      // let sortCountAndCatagory = sortABC.sort((a, b) => {
      //   if (a.category === b.category) {
      //     return b.count - a.count;
      //   }
      //   return a.category.localeCompare(b.category);
      // });
      //----------
      state.searchParts = sortCountABC
 
    },
    editOnePart: (state, action)=>{
      
      //console.log(action.payload)
      
      state.searchParts = state.searchParts.toSpliced(action.payload.index,1,action.payload.data)
      
    },
    searchWorld(state, action){
  
      let sortABC = action.payload.sort((a, b) => a.name.localeCompare(b.name))
      let sortCountABC = sortABC.filter(item => item.count > 0).concat(sortABC.filter(item => item.count === 0))
      state.searchParts = sortCountABC   
      
    },
    setSendVisible(state, action){
      state.sendVisible = action.payload
    },
    addPartAllClients(state,action){
      
      state.parts.push(action.payload)

      let sortABC = state.parts.sort((a, b) => a.name.localeCompare(b.name))
      let sortCountABC = sortABC.filter(item => item.count > 0).concat(sortABC.filter(item => item.count === 0))
      state.searchParts = sortCountABC  

    },
    deletePartAllClients(state, action){
      
      state.searchParts = state.searchParts.filter((part)=>{return part._id != action.payload})
      
    },
    updateCountPartAllClient(state, action){
      
      let array = []

      state.searchParts.forEach(part=>{
        if(part._id === action.payload._id){
          array.push(action.payload)
          part = action.payload
        }
        else{
          array.push(part)
        }
        
      })

      //let sortABC = array.sort((a, b) => a.name.localeCompare(b.name))
      //let sortCountABC = sortABC.filter(item => item.count > 0).concat(sortABC.filter(item => item.count === 0))
      state.searchParts = array 

      
    },
    sendPartAllClients(state, action){
      
      let array = []

      state.searchParts.forEach(part=>{
        if(part._id === action.payload._id){
          array.push(action.payload)
          
        }
        else{
          array.push(part)
        }
      })

      state.searchParts = array
    },
    // updatePartAllClient(state, action){
    //   state.searchParts = 
    // }
    
  }
})

export const { setParts,searchWorld,setSendVisible,setCatagoryes,addPartAllClients,deletePartAllClients,updateCountPartAllClient,sendPartAllClients,editOnePart } = counterSlice.actions

export default counterSlice.reducer