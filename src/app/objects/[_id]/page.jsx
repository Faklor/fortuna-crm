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
    const orders = await Orders.find({objectID:_id})
    const operations = await Operations.find({objectID:_id})
    //default
    //const object = obj
    const visibleObject = JSON.stringify(object)
    const visibleOrders = JSON.stringify(orders)
    const visibleOperation = JSON.stringify(operations)

   

    return (await searchParams).name !== 'editObj'?<div className="objInfo">
    
        <Image src={`/imgsObj/${object.icon}`} width={400} height={360} alt={object.name} priority/>
        
        <h2>{object.catagory.split(' ')[0] +' '+ object.name}</h2>
        <h3>{object.organization}</h3>
        <h4>{object.description}</h4>
        <ControllersObj _id={_id}/>

        {object.catagory !== '🏠 Подразделения' && object.inspection?
            <Inspection date={object.inspection.dateBegin} period={object.inspection.period}/>
            :
            '' 
        }
        {object.bindingParts.length !== 0?<div className='title orderTtile'>
                <h2>Список привязанных запчастей</h2>
                {/* <AddPartInObject/> */}
        </div>:''}
        <BindingParts bindingParts={object.bindingParts}/>
 
        <div className='title'>    
            <h2>История операций</h2>
            
            <Link className="addOperation" href={{pathname:`/objects/${_id}`,query: { name: 'addOperation' }}}>
                <Image src={'/components/add.svg'} width={5} height={5} alt='add_Operation'/>
            </Link>
           
        </div>
        <HistoryOperation visibleOperation={visibleOperation} category={object.catagory} objectID={_id}/>
        
        <div className='title orderTtile'>
            <h2>История выданных запчастей</h2>
            {/* <AddPartInObject/> */}
        </div>
        <HistoryParts visibleOrders={visibleOrders}/>    
    </div>
    :
    <EditObject visibleObject={visibleObject}/>
}
