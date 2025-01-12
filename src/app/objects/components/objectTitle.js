'use client'
import Image from "next/image"
import { useRouter } from "next/navigation"
import '../scss/objectTitle.scss'

export default function ObjectTitle({obj}){
    const router = useRouter()

    // Преобразуем Buffer в base64 строку для отображения изображения
    const getImageSource = (icon) => {
        if (!icon?.data) return '/imgsObj/Default.png'
        
        // Преобразуем массив байтов в base64
        const buffer = Buffer.from(icon.data.data)
        const base64 = buffer.toString('base64')
        return `data:${icon.contentType};base64,${base64}`
    }

    // Определяем класс для изображения
    const imageClass = obj.icon?.contentType?.includes('png') ? 'png' : 'jpg'

    return (
        <div className="object-card" onClick={()=>router.push(`/objects/${obj._id}`)}>
            <div className="image-wrapper">
                <Image 
                    src={getImageSource(obj.icon)}
                    width={150} 
                    height={110} 
                    alt={`img-obj-title-${obj._id}`} 
                    className={imageClass}
                    priority
                />
            </div>
            <div className="object-info">
                <div className="category-badge">
                    <span>{obj.catagory || 'Без категории'}</span>
                </div>
                <h3>{obj.name}</h3>
            </div>
        </div>
    )
}