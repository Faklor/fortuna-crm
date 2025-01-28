import '../scss/part.scss'
import Image from 'next/image'
import { useState,useRef, useEffect } from 'react'
import { usePathname, useRouter } from "next/navigation";

//--------components------------
import UpdateCountPart from './updateCountPart'
import SendPart from './sendPart'
import DeletePart from './deletePart'
import ModuleWindow from './moduleWindow'
import UpdatePart from './updatePart'
import Binding from './binding'

export default function Parts({
    _id,
    name,
    catagory,
    contact,
    count,
    manufacturer,
    sellNumber,
    serialNumber,
    sum,
    index,
    setSelectedPart, 
    bindingObj, 
    workers, 
    objects, 
    catagoryes,
    parts, 
    storageId,
    setVisibleParts
}){
    
    //navigation
     
    //react
    const [visibleEditPanel, setVisibleEditPanel] = useState(false)
    const [visibleBinding, setVisibleBinding] = useState(false)
    const [sendVisible, setSendVisible] = useState(false)
    const [isHighlighted, setIsHighlighted] = useState(false)

    useEffect(() => {
        // Проверяем, соответствует ли hash текущему _id
        if (typeof window !== 'undefined' && window.location.hash === `#${_id}`) {
            // Подсвечиваем компонент
            setIsHighlighted(true)
            // Скроллим к компоненту
            document.getElementById(_id)?.scrollIntoView({ behavior: 'smooth' })
            // Убираем подсветку через 2 секунды
            setTimeout(() => setIsHighlighted(false), 2000)
        }
    }, [_id])
    

    return !visibleEditPanel && !visibleBinding?<div className={`part ${count !== 0 ? '' : 'none'} ${isHighlighted ? 'highlighted' : ''}`} id={_id}>
        <Image src={`/catagoryParts/${catagory}.svg`} width={55} height={55} priority={false} alt={name} onClick={()=>{setSelectedPart(index)}}/>
        <p>{manufacturer?`${name} ( ${manufacturer} )`:name}</p>
        
        <UpdateCountPart count={count} _id ={_id} setVisibleParts={setVisibleParts}/>
        <div className={'noneOtherInformation'}>
            {sellNumber?<div>
                <Image src={'/components/sellNumber.svg'} width={20} height={20} alt='sellNumber'/>
                <p>{sellNumber}</p>
            </div>:<></>}
            {serialNumber?<div>
                <Image src={'/components/serialNumber.svg'} width={20} height={20} alt='serialNumber'/>
                <p>{serialNumber}</p>
            </div>:<></>}
            {sum?<div>
                <Image src={'/components/sum.svg'} width={20} height={20} alt='sum'/>
                <p className='sum'>{sum} б.р.</p>
            </div>:<></>}
            {storageId?<div>
                <Image src={'/components/storageId.svg'} width={20} height={20} alt='storageId'/>
                <p>{storageId}</p>
            </div>:<></>}

            {contact.name || contact.link?<p className='titleContacts'>Контакты</p>:''}

            {contact.name?<div>
                <Image src={'/components/contactName.svg'} width={20} height={20} alt='contactName'/>
                <p>{contact.name}</p>
            </div>:<></>}
            {contact.link?<div>
                <Image src={'/components/link.svg'} width={20} height={20} alt='contactLink'/>
                <p>{contact.link}</p>
            </div>:<></>}
            

            <ModuleWindow _id={_id}
            name={name}
            catagory={catagory}
            contact={contact}
            count={count}
            manufacturer={manufacturer}
            sellNumber={sellNumber}
            serialNumber={serialNumber}
            sum={sum}
            index={index}
            workers={workers}
            teches={objects}
            sendVisible={sendVisible}
            setSendVisible={setSendVisible}
            setVisibleParts={setVisibleParts}
            />
            <div className='controllers'>
                <DeletePart _id={_id} setVisibleParts={setVisibleParts}/>
                <button onClick={()=>setVisibleEditPanel(true)}><Image src={'/components/edit.svg'} width={34} height={34} alt='editPart'/></button>   
                <button onClick={()=>setVisibleBinding(true)}><Image src={'/components/link.svg'}  width={34} height={34} alt='bindingObj'/></button>
                <SendPart count={count} setSendVisible={setSendVisible}/>
            </div>
        </div>
    </div>
    :
    visibleEditPanel && !visibleBinding?
    <UpdatePart 
    _id={_id} 
    name={name}
    catagory={catagory}
    contact={contact}
    manufacturer={manufacturer}
    sellNumber={sellNumber}
    serialNumber={serialNumber}
    sum={sum}
    index={index}
    catagoryes={catagoryes}
    
    setVisibleEditPanel={setVisibleEditPanel}
    setVisibleParts={setVisibleParts}
    />
    :
    <Binding 
    setVisibleBinding={setVisibleBinding} 
    bindingObj={bindingObj}
    _id={_id}
    name={name}
    index={index}
    objects={objects}

    setVisibleParts={setVisibleParts}
    />
    
    
    
}