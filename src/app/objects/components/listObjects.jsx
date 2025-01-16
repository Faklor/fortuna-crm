'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {useRouter} from 'next/navigation'
//-----------components----------------
import ObjectTitle from "./objectTitle"
import SearchObj from "./searchObj"
import FilterCategory from './filterCategory'

export default function ListObjs({objects}){
    //navigation
    const router = useRouter()
    //react
    const [visibleArr, setVisibleArr] = useState([])

    useEffect(() => {
        const parsedObjects = JSON.parse(objects)
        const sortedObjects = parsedObjects.sort((a, b) => {
            return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' })
        })
        setVisibleArr(sortedObjects)
    }, [objects])

    return (
        <>
            {/* Основной контент (левая часть) */}
            <div className="content">
                <div className="objects-grid">
                    {visibleArr.map((obj,index)=>{
                        return <ObjectTitle key={index} obj={obj}/>
                    })}
                </div>
            </div>

            {/* Сайдбар (правая часть) */}
            <div className="sidebar">
                <div className="objects-content">
                    <SearchObj objects={JSON.parse(objects)} setVisibleArr={setVisibleArr}/>
                    <button className="btnAddObj" onClick={()=>router.push('/objects/addObject')}>
                        <Image src={'/components/add.svg'} width={30} height={30} alt="btnAddObj"/>
                        <p>Добавить объект</p>
                    </button>
                    <FilterCategory objects={JSON.parse(objects)} setVisibleArr={setVisibleArr}/>
                </div>
            </div>
        </>
    )
}