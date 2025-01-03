import '../scss/editPanelObj.scss'
import { useState, useRef, useEffect } from "react"
import Image from 'next/image';
import axios from 'axios';
import PreLoader from '@/app/preLoader';


export default function EditPanelObj({name, catagory, organization,_id, description, icon, setEditObj, setObject}){

    //functions
    async function getObjects(){
        return await axios.get('/api/teches')
    }
    
    //default 
    const [objects, setObjectsNew] = useState([])

    useEffect(()=>{
        getObjects()
        .then(res=>{
            setObjectsNew(res.data)
            
        })
        .catch(e=>console.log(e))
    },[])

    let array_categoryes = []
    let filteredArray =[]
    
    if(objects.length !== 0){
        objects.forEach((item)=>{
            if(item.catagory === catagory){

            }
            else{
                array_categoryes.push(item.catagory)
            }
            
        })

        filteredArray = [...new Set(array_categoryes)]
        filteredArray.unshift(catagory)
        
    }
    

    
    //ref
    const inputFileRef = useRef(null);
    
    //react
    const [imgTitle, setImgTitle] = useState(null)
    const [imgUrlCreare, setImgUrlCreate] = useState(null)

    //react-default
    const [oldName, setOldName] = useState(name)
    const [oldCatagory, setOldCatagory] = useState(catagory)
    const [oldOrganization, setOldorganization] = useState(organization)
    const [oldDescription, setOldDescription] = useState(description)

    //functions
    async function postData(formdata){
        return await axios.post('/api/teches/object/update', formdata,{headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
        }})
    }

    function onTitleImageChange(e){
        if (e.target.files && e.target.files[0]) {
            setImgUrlCreate(URL.createObjectURL(e.target.files[0]))
            setImgTitle(e.target.files[0])
        }
    }
    

    async function sendData(e){

        let formData = new FormData()
        
        formData.append('_id',_id)
        formData.append('imgTitle',imgTitle)
        formData.append('name',oldName)
        formData.append('category',oldCatagory)
        formData.append('organization',oldOrganization)
        formData.append('description',oldDescription)
        //console.log(formData.get('imgTitle'))
        postData(formData)
        .then(res=>{
            //console.log(res.data)
            setObject(res.data.newTech)
            //console.log(res.data)
            setEditObj(false)
        })
        .catch(e=>console.log(e))
        
    }



    return <div className="editPanelObj">
        
        <button onClick={()=>setEditObj(false)}>Назад</button>
        <div className='editImg'>
            {imgUrlCreare === null?<Image src={require(`@/res/iconsObjects/${icon}`)} width={500} height={500} alt='editImg'/>
            :imgUrlCreare !== null?<Image src={imgUrlCreare} width={500} height={500} alt='editImg'/>:
            ''}
            <input type="file" onChange={onTitleImageChange} accept="image/png, image/jpeg"/>
        </div>

        <div className='editDefaultState'>
            <input type='text' value={oldName} onChange={(e)=>setOldName(e.target.value)} placeholder='Название (имя)'/>
            <select onChange={(e)=>setOldCatagory(e.target.value)}>
                {filteredArray.map((item,index)=>{
                    return <option key={index} value={item}>{item}</option>
                })}
            </select>
            <input type='text' value={oldOrganization} onChange={(e)=>setOldorganization(e.target.value)} placeholder='Организация'/>
            <textarea type='text' value={oldDescription} onChange={(e)=>setOldDescription(e.target.value)} placeholder='Текст описания'/>
            
        </div> 
        <button onClick={sendData}>Редактировать</button>
    </div>
}   