'use client'
import './scss/main.scss'
import dynamic from "next/dynamic"
import axios from 'axios'
import { useEffect,useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
//components
import ShapefileUploader from './components/ShapefileUploader'

const Map = dynamic(()=> import("./components/map"),{ ssr: false })

export default  function PageClient({visibleArr}){

    //navigate
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    //react
    const [seasons] = useState(JSON.parse(visibleArr))
    const [selectSeason, setSelectSeason] = useState(seasons[0])
    const [fields, setFields] = useState([])
    
    //functions
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

    useEffect(()=>{
        if (typeof window !== 'undefined'){
            router.push(pathname + '?' + createQueryString('season', selectSeason.name))
        }

        getFields(searchParams.get('season'))
        .then(res=>{
            setFields(res.data.fields)
        })
        .catch(err=>{console.log(err)})
    },[])


    return <>
        <div className="select_season">
        Сезон: 
            <select onChange={(e)=>{
                    // setSelectSeason(e.target.value)
                    router.push(pathname + '?' + createQueryString('season', e.target.value))
                    getFields(e.target.value)
                    .then(res=>{
                        setFields(res.data.fields)
                    })
                    .catch(err=>{console.log(err)})
                }}>
                {seasons.map((season,index)=>{
                    return <option key={index} value={season._id}>{season.name}</option>
                })}
                {/* <option value='2025'>2025</option>
                <option value='2024'>2024</option>
                <option value='2023'>2023</option> */}
            </select>
        </div>
        <ShapefileUploader season={searchParams.get('season')}/>
        <Map fields={fields}/>
    </>
}