'use client'
import Image from "next/image"
import { useRouter } from "next/navigation"
import '../scss/objectTitle.scss'

export default function ObjectTitle({obj}){
    const router = useRouter()
    //console.log(obj)
    // Получаем источник изображения
    const getImageSource = (icon) => {
        if (!icon?.fileName) return '/imgsObj/Default.png'
        return `/api/uploads/${icon.fileName}`
    }
    //console.log(getImageSource(obj.icon))
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
                    unoptimized // Отключаем оптимизацию Next.js для динамических изображений
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