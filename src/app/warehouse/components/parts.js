import '../scss/parts.scss'
//--------componet----------
import Part from './part'
import { useState, useRef } from 'react';

export default function Parts({
    array, 
    workers, 
    objects,

    setVisibleParts
}){

    //react
    //const [selectedPart, setSelectedPart] = useState()
    let array_categoryes = []
    if(array !== undefined){
        array.map((item)=>{
            array_categoryes.push(item.catagory)
        })
    }
    

    let filteredArray = [...new Set(array_categoryes)]
    //refs
    const partsRefs = useRef([])
    let previousIndex = null

    function setActive(index){
        

        if (index === previousIndex) {
            let className = partsRefs.current[index].children[0].children[3].className
            if( className === 'otherInformation'){
                partsRefs.current[index].children[0].children[3].classList.remove('otherInformation')
                partsRefs.current[index].children[0].children[3].classList.add('noneOtherInformation')
            }
            else if(className === 'noneOtherInformation'){
                partsRefs.current[index].children[0].children[3].classList.remove('noneOtherInformation')
                partsRefs.current[index].children[0].children[3].classList.add('otherInformation')
            }

        } else {
            partsRefs.current[index].children[0].children[3].classList.remove('noneOtherInformation')
            partsRefs.current[index].children[0].children[3].classList.add('otherInformation')


            partsRefs.current.forEach((el,i)=>{
                if(el !==null && i !== index){
                    el.children[0].children[3].classList.remove('otherInformation')
                    el.children[0].children[3].classList.add('noneOtherInformation')
                }
            
            })
        }
        
          
        previousIndex = index;
    }

    return <div className="parts">
        {
            array!==undefined?array.map((el,index)=>{
                return <div key={index} ref={el=>{
                    partsRefs.current[index] = el
                }}><Part {...el} 
                    index={index} 
                    setSelectedPart={setActive} 
                    workers={workers} 
                    objects={objects} 
                    catagoryes={filteredArray}
                    setVisibleParts={setVisibleParts}
                /></div>
            }):''
        }
    </div>
}