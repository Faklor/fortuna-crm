'use client'
import '../scss/addPartBt.scss'
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import anime from 'animejs'

//---------------components-----------------
import Parts from "./parts"
import Search from "./search"
import SlyderCategory from './slyder_category'
import SortingOptions from './SortingOptions'

export default function WareHouse({parts, workers, objects}){
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [visibleParts, setVisibleParts] = useState(JSON.parse(parts))
    const [visibleObjects, setVisibleObjects] = useState(JSON.parse(objects))
    const [visibleWorkers, setVisibleWorkers] = useState(JSON.parse(workers))
    
    const sidebarRef = useRef(null)
    const contentRef = useRef(null)

    // Анимация при первой загрузке
    useEffect(() => {
        const timeline = anime.timeline({
            easing: 'easeOutExpo'
        });

        timeline
            // Анимация сайдбара
            .add({
                targets: sidebarRef.current,
                translateX: [-50, 0],
                opacity: [0, 1],
                duration: 800
            })
            // Анимация поиска и кнопки добавления
            .add({
                targets: '.controlls > *',
                translateY: [-20, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 600
            }, '-=600')
            // Анимация категорий
            .add({
                targets: '.category-item',
                scale: [0.8, 1],
                opacity: [0, 1],
                delay: anime.stagger(50),
                duration: 600
            }, '-=400')
            // Анимация сортировки
            .add({
                targets: '.sorting-options',
                translateY: [-20, 0],
                opacity: [0, 1],
                duration: 600
            }, '-=400')
            // Анимация карточек запчастей
            .add({
                targets: '.part-card',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: anime.stagger(50, {
                    grid: [3, 3],
                    from: 'center'
                }),
                duration: 600
            }, '-=400');
    }, []);

    // Анимация при обновлении списка запчастей
    useEffect(() => {
        const sortedParts = JSON.parse(parts).sort((a, b) => {
            return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
        });
        
        // Анимация обновления списка
        anime({
            targets: '.part-card',
            opacity: [0, 1],
            scale: [0.95, 1],
            delay: anime.stagger(50, {
                grid: [3, 3],
                from: 'center'
            }),
            duration: 400,
            easing: 'easeOutCubic',
            complete: () => setVisibleParts(sortedParts)
        });
    }, [parts]);

    // Обработчик перехода на страницу добавления запчасти
    const handleAddPartClick = () => {
        setIsLoading(true);
        anime({
            targets: '.content',
            opacity: 0,
            translateY: 20,
            duration: 300,
            easing: 'easeOutCubic',
            complete: () => router.push('/warehouse/addPart')
        });
    };

    // Обработчик перехода на страницу добавления запчасти из формы заявки
    const handleAddPartFromReqClick = () => {
        // Сохраняем текущий URL для возврата
        sessionStorage.setItem('returnToReq', window.location.pathname);
        router.push('/warehouse/addPart');
    };

    return <>
        <div className='sidebar' ref={sidebarRef} style={{opacity: 0}}>
            <div className='controlls'>
                <Search parts={JSON.parse(parts)} setVisibleParts={setVisibleParts}/>
                <div className="button-group">
                    <button 
                        className="addPartBt"
                        onClick={handleAddPartClick}
                    >
                        <Image 
                            src={'/components/add.svg'} 
                            width={40} 
                            height={40} 
                            alt='addPartButton' 
                            priority
                        />
                    </button>
                    {window.location.pathname.includes('/tasks') && (
                        <button 
                            className="addPartFromReqBt"
                            onClick={handleAddPartFromReqClick}
                            title="Добавить новую запчасть"
                        >
                            <Image 
                                src={'/components/addPart.svg'} 
                                width={34} 
                                height={34} 
                                alt='addNewPart'
                            />
                        </button>
                    )}
                </div>
            </div>
            <h2>Категории</h2>
            <SlyderCategory parts={JSON.parse(parts)} setVisibleParts={setVisibleParts}/>
            <h2>Сортировка</h2>
            <SortingOptions 
                originalParts={JSON.parse(parts)}
                visibleParts={visibleParts}
                setVisibleParts={setVisibleParts}
            />
        </div>
        
        <div className='content' ref={contentRef}>
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                </div>
            )}
            <Parts 
                array={visibleParts} 
                workers={visibleWorkers} 
                objects={visibleObjects} 
                setVisibleParts={setVisibleParts}
            />
        </div>
    </>
}