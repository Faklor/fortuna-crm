'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter  } from 'next/navigation'
import './page.scss'

export default function Page(){

    //navigation
    const router = useRouter()
    //default
    let array_categoryes = []
    let filteredArray =[]

    //react
    const [objects, setObjects] = useState([])
    //const [socket, setSocket] = useState(null)


    if(objects.length !== 0){
        objects.forEach((item)=>{
            array_categoryes.push(item.catagory)                        
        })

        filteredArray = [...new Set(array_categoryes)]
        filteredArray.unshift('Выберите категорию')   
    }
    //axios
    async function getObjs(){
        return await axios.get('/api/teches')
    }

    useEffect(()=>{
        

        getObjs()
        .then(res=>{
            setObjects(res.data.tech)
        })
        .catch(e=>console.log(e))

    },[])
   
    
    //react-default
        //img
    const [icon, setIcon] = useState(null)
    const [timeIcon, setTimeIcon] = useState(null)
        //other
    const [name, setName] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [organization, setOrganization] = useState('')

    //functions
    function onTitleImageChange(e){
        if (e.target.files && e.target.files[0]) {
            setTimeIcon(URL.createObjectURL(e.target.files[0]))
            setIcon(e.target.files[0])
        }
    }
    async function postData(formdata){
        return await axios.post('/api/teches/object/add', formdata,{headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
        }})
    }
    async function sendData(e){

        let formData = new FormData()
        
        formData.append('icon',icon)
        formData.append('name',name)
        formData.append('category',category)
        formData.append('organization',organization)
        formData.append('description',description)
        
        postData(formData)
        .then(res=>{
            //console.log(res.data.newTech)
       
            router.push('/objects')
        })
        .catch(e=>console.log(e))
       
    }
   


    return <div className='addObject'>
        <button onClick={()=>router.push('/objects')}>Отмена</button>

        {icon === null?
        <Image src={`/imgsObj/Default.png`} width={300} height={300} alt='editImg'/>
        :<Image src={timeIcon} width={300} height={300} alt='editImg'/>}

        <input type="file" onChange={onTitleImageChange} accept="image/png, image/jpeg"/>

        <input type='text' value={name} onChange={e=>setName(e.target.value)} placeholder='Название ( имя )'/>
        <select onChange={e=>setCategory(e.target.value)}>
            {filteredArray.map((item,index)=>{
                return <option key={index} value={item}>{item}</option>
            })}
        </select>
        <input type='text' value={organization} onChange={e=>setOrganization(e.target.value)} placeholder='Организация'/>
        <textarea type='text' value={description} onChange={e=>setDescription(e.target.value)} placeholder='Описание'/>

        <button onClick={sendData}> Добавить </button>
    </div>
}