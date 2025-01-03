'use client'
import Image from "next/image"
import { useRouter } from "next/navigation"


export default function ObjectTitle({obj}){

    const router = useRouter()
    const searchTypeFile = '(?:png|jpe?g)'
    // let visibleImg = ''
    // try{
    //     visibleImg = require(`/imgsObj/${obj.icon}`)
    // }
    // catch(e){
    //     visibleImg = require(`/imgsObj/Default.png`)
    // }

    return <div className="object_title" onClick={()=>router.push(`/objects/${obj._id}`)}>
        <Image 
            src={`/imgsObj/${obj.icon}`} 
            width={150} 
            height={110} 
            alt={`img-obj-title-${obj._id}`} 
            className={obj.icon.match(searchTypeFile)[0] === 'png'?'png':'jpg'} priority/>
        <p>{obj.name}</p>
    </div>
}