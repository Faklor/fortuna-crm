'use client'
import './scss/main.scss'
import dynamic from "next/dynamic"
import axios from 'axios'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
//components
import ShapefileUploader from './components/ShapefileUploader'

const Map = dynamic(()=> import("./components/map"),{ ssr: false })

export default function PageClient({visibleArr}){
    //navigate
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    
    //react
    const [seasons, setSeasons] = useState(JSON.parse(visibleArr))
    // Получаем сезон из URL при инициализации
    const urlSeason = searchParams.get('season')
    const [selectSeason, setSelectSeason] = useState(() => {
        // Если есть сезон в URL, находим его в списке сезонов
        if (urlSeason) {
            const foundSeason = JSON.parse(visibleArr).find(s => s.name === urlSeason)
            return foundSeason || JSON.parse(visibleArr)[0]
        }
        return JSON.parse(visibleArr)[0]
    })
    const [fields, setFields] = useState([])
    const [newSeasonName, setNewSeasonName] = useState('')
    
    const createQueryString = useCallback(
        (name, value) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set(name, value)
          return params.toString()
        },
        [searchParams]
    )

    async function getFields(season) {
        return await axios.post('/api/fields', {season: season})
    }

    const handleAddSeason = async () => {
        if (!newSeasonName) return;
        
        try {
            const res = await axios.post('/api/fields/season', { name: newSeasonName });
            setSeasons(prev => [...prev, res.data]);
            setNewSeasonName('');
        } catch (error) {
            console.error('Error adding season:', error);
            alert('Ошибка при добавлении сезона');
        }
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Проверяем, есть ли сезон в URL
            const currentUrlSeason = searchParams.get('season')
            if (!currentUrlSeason) {
                // Если нет, устанавливаем текущий выбранный сезон
                router.push(pathname + '?' + createQueryString('season', selectSeason.name))
            }

            // Загружаем поля для сезона из URL или выбранного сезона
            getFields(currentUrlSeason || selectSeason.name)
                .then(res => {
                    setFields(res.data.fields)
                })
                .catch(err => {console.log(err)})
        }
    }, [selectSeason, pathname, router, searchParams])

    return <>
        <div className="select_season">
            <div className="season-controls">
                <div>
                    Сезон: 
                    <select 
                        value={selectSeason._id}
                        onChange={(e)=>{
                            const selectedSeason = seasons.find(s => s._id === e.target.value);
                            setSelectSeason(selectedSeason);
                            router.push(pathname + '?' + createQueryString('season', selectedSeason.name));
                            getFields(selectedSeason.name)
                            .then(res=>{
                                setFields(res.data.fields)
                            })
                            .catch(err=>{console.log(err)})
                        }}
                    >
                        {seasons.map((season) => (
                            <option key={season._id} value={season._id}>
                                {season.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="add-season">
                    <input
                        type="text"
                        value={newSeasonName}
                        onChange={(e) => setNewSeasonName(e.target.value)}
                        placeholder="Новый сезон (год)"
                    />
                    <button onClick={handleAddSeason}>Добавить сезон</button>
                </div>
            </div>
        </div>
        {/* <ShapefileUploader season={searchParams.get('season')}/> */}
        <Map 
            fields={fields} 
            currentSeason={searchParams.get('season')}
        />
    </>
}