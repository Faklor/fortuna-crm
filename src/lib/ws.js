import WebSocket from "ws"

const WS_URi = process.env.WS_URi

const getWS = ()=>{

    const ws = new WebSocket(WS_URi)

    return ws
}

export default getWS