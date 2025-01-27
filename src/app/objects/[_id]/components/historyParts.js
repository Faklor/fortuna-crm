'use client'
import '../scss/historyParts.scss'
import Image from 'next/image'
import axios from 'axios'
//------------components-------------
//import EditOrder from './editOrder'
//import Part from '../../warehouse/components/part'
import { useEffect, useState } from 'react'

export default function HistoryParts({visibleOrders}){
    
    //let sortArray = parts.sort((a,b)=>new Date(b.date) - new Date(a.date))

    //default
    const [parts,setParts] = useState(JSON.parse(visibleOrders))
    //react
    const [editOrder, setEditOrder] = useState(false)
    //default
    const uniqueDates = {}

    function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('ru-RU', options)
    }

    function getOperationTypeColor(type) {
        switch(type) {
            case 'operation':
                return '#FA5C62' 
            case 'manual':
                return '#374151' 
            case 'request':
                return '#84E168' 
            default:
                return '#6b7280'
        }
    }

    function getOperationTypeText(type) {
        switch(type) {
            case 'operation':
                return 'После операции'
            case 'manual':
                return 'Выдача со склада'
            case 'request':
                return 'После заявки'
            default:
                return 'Выдача со склада'
        }
    }

    parts.forEach(item => {
    const { _id, date, workerName, part, countPart, description, operationType } = item
    if (!uniqueDates[new Date(date).toLocaleDateString()]) {
        uniqueDates[new Date(date).toLocaleDateString()] = { date: formatDate(date), data: [{ _id, workerName, part, countPart, description, operationType }] }
    } else {
        uniqueDates[new Date(date).toLocaleDateString()].data.push({ _id, workerName, part,countPart, description, operationType })
    }
    })

    let sortArray = Object.values(uniqueDates).reverse()
    

    //console.log(sortArray)
   
    
    //functions
    async function deleteOrder(_id, part, count){
        return await axios.post('/api/orders/delete', {_id:_id, part:part,count:count})
    }


    return <div className="historyParts" > 
        {parts.length?
            <div className="parts-accordion">
                {sortArray.map((item,index)=>{
                    return (
                        <details className='parts-item' key={index}>
                            <summary className='parts-header'>
                                <span className="parts-date">{item.date}</span>
                                <span className="parts-count">{item.data.length}</span>
                            </summary>
                            <div className='parts-content'>
                                {item.data.map((el,index)=>{
                                    return <div key={index} className='infoOrder'>
                                        <div className='worker'>
                                            <div className='worker-info'>
                                                <p>{el.workerName}</p>
                                                <span 
                                                    className='operation-type'
                                                    style={{ 
                                                        backgroundColor: `${getOperationTypeColor(el.operationType)}50`, // добавляем прозрачность
                                                        color: getOperationTypeColor(el.operationType)
                                                    }}
                                                >
                                                    {getOperationTypeText(el.operationType)}
                                                </span>
                                            </div>
                                            <div className='controllers'>
                                                {/* <button onClick={()=>{
                                                    setEditOrder(true)
                                                }}><Image src={require('@/res/components/edit.svg')} width={10} height={10} alt='editOrder'/></button> */}
                                                {el.operationType && el.operationType === 'manual'?<button onClick={async ()=>{
                                                   
                                                    deleteOrder(el._id, el.part, el.countPart)
                                                    .then(res=>{
                                                    
                                                        setParts((prevParts) => prevParts.filter((part) => part._id !== res.data))
                                                        
                                                    })
                                                    .catch(e=>{
                                                        console.log(e)
                                                    })
                                                }}><Image src={'/components/delete.svg'} width={10} height={10} alt='deleteOrder'/></button>:null}
                                            </div>
                                        </div>
                                        <div className='part'>
                                            <Image src={`/catagoryParts/${el.part.catagory}.svg`} width={20} height={20} alt='img_category'/>
                                            <p>{el.part.name}</p>
                                            <p className='count'>{el.countPart +' '+el.description}</p>
                                            <div className='otherInformation'>
                                                {el.part.sellNumber?<div>
                                                    <Image src={'/components/sellNumber.svg'} width={20} height={20} alt='sellNumber'/>
                                                    <p>{el.part.sellNumber}</p>
                                                </div>:<></>}
                                                {el.part.serialNumber?<div>
                                                    <Image src={'/components/serialNumber.svg'} width={20} height={20} alt='serialNumber'/>
                                                    <p>{el.part.serialNumber}</p>
                                                </div>:<></>}
                                                {el.part.sum?<div>
                                                    <Image src={'/components/sum.svg'} width={20} height={20} alt='sum'/>
                                                    <p className='sum'>{el.part.sum} б.р.</p>
                                                </div>:<></>}
                                                {el.part.contact && 
                                                el.part.contact.name || 
                                                el.part.contact &&
                                                el.part.contact.link?<p className='titleContacts'>Контакты</p>:''}
                                                

                                                {el.part.contact && el.part.contact.name?<div>
                                                    <Image src={'/components/contactName.svg'} width={20} height={20} alt='contactName'/>
                                                    <p>{el.part.contact.name}</p>
                                                </div>:<></>}
                                                {el.part.contact && el.part.contact.link?<div>
                                                    <Image src={'/components/link.svg'} width={20} height={20} alt='contactLink'/>
                                                    <p>{el.part.contact.link}</p>
                                                </div>:<></>}
                                            </div>
                                        </div>
                                    </div>
                                })}
                            </div>
                        </details> 
                    )
                })}
            </div>
        : <p className="no-parts">Нет выданных запчестей</p>}
    </div>
   
}