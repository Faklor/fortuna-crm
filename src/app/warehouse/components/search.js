import '../scss/search.scss'
import Image from 'next/image'
import { useState } from 'react'

//-------redux------------
import { useSelector, useDispatch } from 'react-redux'
import { searchWorld } from '@/store/slice/partsArray' 

export default function Search({parts, setVisibleParts}){
    const [search, setSearch] = useState('')

    // Функция сортировки массива (как в ListParts.jsx)
    const sortParts = (array) => {
        return [...array].sort((a, b) => {
            return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
        });
    };

    return <div className="search">
        <Image src={'/components/search.svg'} width={40} height={40} alt='search' priority={false}/>
        <input type='text' defaultValue={search} onChange={e=>{
            setSearch(e.target.value)
            let filteredParts;
            
            if (e.target.value === '') {
                // Если поиск пустой, возвращаем отсортированный исходный массив
                filteredParts = sortParts(parts);
            } else {
                // Если есть поисковый запрос, фильтруем и сортируем
                filteredParts = sortParts(
                    parts.filter(item => 
                        item.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        (item.manufacturer && item.manufacturer.toLowerCase().includes(e.target.value.toLowerCase()))
                    )
                );
            }
            
            setVisibleParts(filteredParts);
        }} placeholder='Поиск'/>
    </div>
}