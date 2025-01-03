import { configureStore } from "@reduxjs/toolkit"

//---values--------
import category from './slice/category'
import partsArray from './slice/partsArray'
import objectsArray from './slice/objectsArray'
import workers from './slice/workers'
import notices from './slice/notices'
import socket from './slice/socket'

export const store = () => {
    return configureStore({
        reducer: {
            socket:socket,
            category:category,
            partsRedux: partsArray,
            objectsArray:objectsArray,
            workers:workers,
            notices:notices,
        }
    })
}

