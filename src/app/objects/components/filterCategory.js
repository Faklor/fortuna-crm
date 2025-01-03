'use client'
import '../scss/categoryesObject.scss'
import Image from 'next/image'
import { useRef, useEffect } from 'react';

export default function SearchObj({objects, setVisibleArr}){

    //default
    let array_categoryes = []
    objects.forEach((item)=>{
        array_categoryes.push(item.catagory)
    })
    

    let filteredArray = [...new Set(array_categoryes)]
    filteredArray.unshift('Все')
    //ref
    const categoryRef = useRef([])


    useEffect(()=>{
       categoryRef[0].classList.add('active')
    },[ categoryRef])
  

    return <div className='catagoryesObj'>
        {filteredArray.map((category,index)=>{
            return <div className='categoryObj' key={index}  ref={el=>categoryRef[index]=el} onClick={e=>{
                let oldParts = objects.slice()
                oldParts = oldParts.filter(item => item.catagory === category)
                if(category === 'Все'){
                    setVisibleArr(objects)
                }
                else{
                    setVisibleArr(oldParts)
                }     
                    
                //categoryRef[index].classList.add('active')
                if(categoryRef.current){
                    delete categoryRef.current
                }
                
                
                Object.values(categoryRef).forEach(el=>{
                    if(el === categoryRef[index]){
                        el.classList.add('active')
                        //console.log(el.textContent)
                        
                        //category!=='All'?dispatch(filterCategory(el.textContent)):dispatch(filterCategory('All'))
                        //router.push(`/objects?category=${el.textContent}`)
                        
                        
                        
                    }
                    else{
                        if(el){
                            el.classList.remove('active')
                        }
                        
                    }
                    
                })
               
            }}>
                {category==='Все'?
                    <div className='catagory'>
                        <Image src={'/components/all.svg'} width={60} height={60} alt='allCategoryes'/>
                        <p>{category}</p>
                    </div>
                    :
                    <div className='catagory'>
                        <span>{category.split(' ')[0]}</span>
                        <p>{category.split(' ')[1]}</p>
                    </div>
                    
                }
                
            </div>
        })}
    </div>
}
  
