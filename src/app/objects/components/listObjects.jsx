'use client'
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from 'next/navigation'
import anime from 'animejs'
//-----------components----------------
import ObjectTitle from "./objectTitle"
import SearchObj from "./searchObj"
import FilterCategory from './filterCategory'

export default function ListObjs({objects}){
    const router = useRouter()
    const [visibleArr, setVisibleArr] = useState([])
    const gridRef = useRef(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const parsedObjects = JSON.parse(objects)
        const sortedObjects = parsedObjects.sort((a, b) => {
            return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' })
        })
        setVisibleArr(sortedObjects)
    }, [objects])

    useEffect(() => {
        if (gridRef.current) {
            anime({
                targets: '.object-card',
                scale: [0.8, 1],
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(100),
                easing: 'easeOutElastic(1, .8)',
                duration: 800
            })
        }
    }, [visibleArr])

    const handleNavigate = (path) => {
        setIsLoading(true)
        router.push(path)
    }

    return (
        <>
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                </div>
            )}
            
            <div className="content">
                <div className="objects-grid" ref={gridRef}>
                    {visibleArr.map((obj, index) => (
                        <div key={index} onClick={() => handleNavigate(`/objects/${obj._id}`)}>
                            <ObjectTitle obj={obj}/>
                        </div>
                    ))}
                </div>
            </div>

            <div className="sidebar">
                <div className="objects-content">
                    <SearchObj objects={JSON.parse(objects)} setVisibleArr={setVisibleArr}/>
                    <button 
                        className="btnAddObj" 
                        onClick={() => handleNavigate('/objects/addObject')}
                    >
                        <Image src={'/components/add.svg'} width={30} height={30} alt="btnAddObj"/>
                        <p>Добавить объект</p>
                    </button>
                    <FilterCategory objects={JSON.parse(objects)} setVisibleArr={setVisibleArr}/>
                </div>
            </div>
        </>
    )
}