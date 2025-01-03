import '../scss/slyder_category.scss'
import Image from 'next/image'
import { useEffect, useRef } from 'react'


export default function SlyderCategory({parts, setVisibleParts}){
    
    //refs
    const defaultRef = useRef(null)
    const arrayRefs = useRef([])
    

    let array_categoryes = []
    parts.forEach((item)=>{
        array_categoryes.push(item.catagory)
    })

     
    //array_categoryes.unshift('Все')
    let filteredArray = [...new Set(array_categoryes)]
    

    
    //-------------

    return <div className='slyder_category'>
        <div className='category active' onClick={()=>{
            defaultRef.current.classList.add('active')
            
            //-----
            arrayRefs.current.forEach(el=>{
                el.classList.remove('active')
                setVisibleParts(parts)
            })
            
            }} ref={defaultRef}>
            <Image src={'/catagoryParts/Все.svg'} width={68} height={68} alt='defaultImgCategory' priority/>
            <p>Все</p>
        </div>

        {filteredArray.map((el, index)=>{

            return <div className='category' key={index} onClick={()=>{
                defaultRef.current.classList.remove('active')
                arrayRefs.current.forEach(item=>{
                    
                    
                    if(el === item.innerText){
                        item.classList.add('active')
                        let categoryParts = parts.filter(part=>part.catagory === item.textContent)
                        setVisibleParts(categoryParts)
                        //console.log(item.textContent)
                    }
                    else{
                        item.classList.remove('active')
                    }
                })
            }} ref={el=>arrayRefs.current[index] = el}>
                <Image src={`/catagoryParts/${el}.svg`} width={68} height={68} alt={`${el.catagory}`} priority/>
                <p>{el}</p>
            </div>
        })}
    </div>
}