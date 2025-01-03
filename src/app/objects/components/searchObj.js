import '../scss/searchObj.scss'
import Image from 'next/image'
import { useState } from 'react'

export default function SearchObj({objects, setVisibleArr}){


    //react
    const [search, setSearch] = useState()

    return <div className="searchObj">
        <Image src={'/components/search.svg'} width={40} height={40} alt='search' priority={false}/>
        <input type='text' defaultValue={search} onChange={e=>{
            setSearch(e.target.value)
            //перебор массива, поиск по массиву 
            let oldParts = objects.slice()
            oldParts = oldParts.filter(item => item.name.toLowerCase().includes(e.target.value.toLowerCase()))
            
            setVisibleArr(oldParts)
            
        }} placeholder='Поиск'/>
    </div>
}