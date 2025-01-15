'use client'
import '../scss/addPartBt.scss'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

//---------------components-----------------
import Parts from "./parts"
import Search from "./search"
import SlyderCategory from './slyder_category'

export default function WareHouse({parts, workers, objects}){
    //react
    const [visibleParts, setVisibleParts] = useState(JSON.parse(parts))
    const [visibleObjects, setVisibleObjects] = useState(JSON.parse(objects))
    const [visibleWorkers, setVisibleWorkers] = useState(JSON.parse(workers))
    const router = useRouter()

    // Сортировка массива при инициализации и при обновлении parts
    useEffect(() => {
        const sortedParts = JSON.parse(parts).sort((a, b) => {
            return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
        });
        setVisibleParts(sortedParts);
    }, [parts]);

    return <>
        <div className='sidebar'>

            <div className='controlls'>
                <Search parts={JSON.parse(parts)} setVisibleParts={setVisibleParts}/>
                <button className="addPartBt">
                    <Image 
                        src={'/components/add.svg'} 
                        width={40} 
                        height={40} 
                        alt='addPartButton' 
                        onClick={()=>router.push('/warehouse/addPart')} 
                        priority
                    />
                </button>
            </div>
            <h2>Категории</h2>
            <SlyderCategory parts={JSON.parse(parts)} setVisibleParts={setVisibleParts}/>
            
        </div>
        <div className='content'>
            <Parts 
                array={visibleParts} 
                workers={visibleWorkers} 
                objects={visibleObjects} 
                setVisibleParts={setVisibleParts}
            />
        </div>
    </>
}