import axios from "axios";
import dbConnect from "@/lib/db";
import Tech from "@/models/tech";
import Operations from "@/models/operations";
import Orders from "@/models/orders";
import Link from "next/link";
import Image from "next/image";
import './scss/objInfo.scss'
//----------components-------------
import ControllersObj from "./components/controllertsObj";
import Inspection from "./components/inspection";
import HistoryParts from "./components/historyParts";
import HistoryOperation from "./components/historyOperations";
import BindingParts from "./components/BindingParts";
import EditObject from './components/editObject'
import ImageWithFallback from "./components/ImageWithFallback"
import Workers from "@/models/workers";
import Parts from "@/models/parts";

export const revalidate = 1
export const dynamicParams = true

export async function generateStaticParams() {
    await dbConnect()

    try{
        const objects = await Tech.find({})
    
        return objects.map((obj)=>({
            _id:String(obj._id)
        }))
    }
    catch(e){
    
    }
}

export default async function Page({params, searchParams}){
    await dbConnect()
    //other
    const {_id} = await params
    //db
    
    const object = await Tech.findOne({_id})
    const orders  = await Orders.find({objectID:_id}) 
    const operations  = await Operations.find({objectID:_id})  
    const workers = await Workers.find({}) 
    const parts = await Parts.find({})     
    // Если объект не найден, можно показать сообщение об ошибке
    if (!object) {
        return (
            <div className="error-container">
                <h1>Объект не найден</h1>
                <Link href="/objects" className="back-button">
                    <Image src="/components/back.svg" width={24} height={24} alt="Назад"/>
                    <span>Вернуться к списку объектов</span>
                </Link>
            </div>
        )
    }

    const visibleObject = JSON.stringify(object)
    const visibleOrders = JSON.stringify(orders)
    const visibleOperation = JSON.stringify(operations)
    const visibleWorkers = JSON.stringify(workers)
    const visibleParts = JSON.stringify(parts)

    // Преобразуем icon в простой объект, только если объект существует
    const iconData = object?.icon ? {
        fileName: object.icon.fileName,
        contentType: object.icon.contentType
    } : null

    return (await searchParams).name !== 'editObj' ? (
        <div className="objInfo">
            <div className="objInfo-container">
                {/* Левая часть (основная информация) */}
                <div className="column main-info">
                    <Link href="/objects" className="back-button">
                        <Image src="/components/back.svg" width={24} height={24} alt="Назад"/>
                        <span>Назад</span>
                    </Link>
                    
                    <div className="object-image-wrapper">
                        <ImageWithFallback 
                            icon={iconData}
                            width={400} 
                            height={360} 
                            alt={object.name || 'Object image'}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    
                    <h2>{object.catagory.split(' ')[0] +' '+ object.name}</h2>
                    <h3>{object.organization}</h3>
                    <h4>{object.description}</h4>

                    {object.catagory === '🚃 Прицепы' && 
                     object.captureWidth !== null && 
                     object.captureWidth !== undefined && 
                     object.captureWidth !== 0 && (
                        <div className="capture-width-info">
                            <span className="capture-width-label">Ширина захвата:</span>
                            <span className="capture-width-value">{object.captureWidth.toFixed(1)} м</span>
                        </div>
                    )}

                    <ControllersObj _id={_id}/>

                    {/* Инспекции и привязанные запчасти */}
                    {object.catagory !== '🏢 Подразделения' && object.inspection && (
                        <Inspection date={object.inspection.dateBegin} period={object.inspection.period}/>
                    )}
                    
                    {object.bindingParts.length !== 0 && (
                        <>
                            <div className='title orderTtile'>
                                <h2>Список привязанных запчастей</h2>
                            </div>
                            <BindingParts bindingParts={object.bindingParts}/>
                        </>
                    )}
                </div>

                {/* Правая часть (история) */}
                <div className="column history">
                    <div className='title'>    
                        <h2>История операций</h2>
                        <Link className="addOperation" href={{pathname:`/objects/${_id}`,query: { name: 'addOperation' }}}>
                            <Image src={'/components/add.svg'} width={5} height={5} alt='add_Operation'/>
                        </Link>
                    </div>
                    <HistoryOperation 
                        visibleOperation={visibleOperation} 
                        category={object.catagory} 
                        objectID={_id}
                        visibleWorkers={visibleWorkers}
                        visibleParts={visibleParts}
                    />
                    
                    <div className='title orderTtile'>
                        <h2>История выданных запчастей</h2>
                    </div>
                    <HistoryParts visibleOrders={visibleOrders}/>    
                </div>
            </div>
        </div>
    ) : (
        <EditObject visibleObject={visibleObject}/>
    )
}
