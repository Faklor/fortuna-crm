'use client'
import { useState } from "react"
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
    const [visibleArr, setVisibleArr] = useState(JSON.parse(objects))

    return <>
        <button className="btnAddObj" onClick={()=>router.push('/objects/addObject')}>
            <Image src={'/components/add.svg'} width={30} height={30} alt="btnAddObj"/>
            <p>Добавить объект</p>
        </button>
        <FilterCategory objects={JSON.parse(objects)} setVisibleArr={setVisibleArr}/>
        <SearchObj objects={JSON.parse(objects)} setVisibleArr={setVisibleArr}/>
        {visibleArr.map((obj,index)=>{
                return <ObjectTitle key={index} obj={obj}/>
            })
        }
    </>
}