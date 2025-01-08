'use client'
import Image from "next/image"
import { useRouter } from "next/navigation"
import '../scss/objectTitle.scss'

export default function ObjectTitle({obj}){
    const router = useRouter()
    const searchTypeFile = '(?:png|jpe?g)'

    return (
        <div className="object-card" onClick={()=>router.push(`/objects/${obj._id}`)}>
            <div className="image-wrapper">
                <Image 
                    src={`/imgsObj/${obj.icon}`} 
                    width={150} 
                    height={110} 
                    alt={`img-obj-title-${obj._id}`} 
                    className={obj.icon.match(searchTypeFile)[0] === 'png' ? 'png' : 'jpg'}
                    priority
                />
            </div>
            <div className="object-info">
                <h3>{obj.catagory || 'Без категории'}{obj.name}</h3>
                
            </div>
        </div>
    )
}