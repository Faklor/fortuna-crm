'use client'
import '../scss/editPanelObj.scss'
import { useState, useRef, useEffect } from "react"
import Image from 'next/image';
import axios from 'axios';
import { usePathname, useRouter } from 'next/navigation';
import { revalidateObject } from '../../../actions';


export default function EditPanelObj({visibleObject}){

    //navigation
    const router = useRouter()
    // const pathname = usePathname()
    // const _id = pathname.split('/')[2] 
    //functions
    async function getObjects(){
        return await axios.get('/api/teches')
    }
    async function getObj(_id){
        return await axios.post('/api/teches/object', {_id:_id})
    }
    
    //default 
    const [objects, setObjectsNew] = useState([])
    const parsedObject = JSON.parse(visibleObject)
    
    // Преобразуем данные изображения
    const [obj, setObj] = useState({
        ...parsedObject,
        icon: parsedObject.icon ? {
            ...parsedObject.icon,
            data: parsedObject.icon.data ? {
                type: 'Buffer',
                data: Array.from(parsedObject.icon.data.data)
            } : null
        } : null
    })

    //ref
    const inputFileRef = useRef(null);
    
    //react
    const [imgTitle, setImgTitle] = useState(null)
    const [imgUrlCreare, setImgUrlCreate] = useState(null)
    const [error, setError] = useState(false)

    //react-default
    const [oldImg, setOldImage] = useState(obj.icon)
    const [oldName, setOldName] = useState(obj.name)
    const [oldCatagory, setOldCatagory] = useState(obj.catagory)
    const [oldOrganization, setOldorganization] = useState(obj.organization)
    const [oldDescription, setOldDescription] = useState(obj.description)

    useEffect(()=>{
        getObjects()
        .then(res=>{
            setObjectsNew(res.data.tech)
        })
        .catch(e=>console.log(e))

        getObj(obj._id)
        .then(res=>{
            setObj(res.data)
        })
        .catch(e=>console.log(e))

    },[])

    let array_categoryes = []
    let filteredArray =[]
    
    if(objects.length !== 0){
        objects.forEach((item)=>{
            if(item.catagory === obj.catagory){

            }
            else{
                array_categoryes.push(item.catagory)
            }
            
        })

        filteredArray = [...new Set(array_categoryes)]
        filteredArray.unshift(obj.catagory)
        
    }
    

    
    

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
            setError(false)
        }
    }
    

    async function sendData(e){
        let formData = new FormData()
        
        // Добавим проверку файла
        if (imgTitle) {
            const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            const fileExtension = imgTitle.name.split('.').pop().toLowerCase();
            
            if (!validExtensions.includes(fileExtension)) {
                alert('Неподдерживаемый формат файла');
                return;
            }
        }
        
        formData.append('_id', obj._id)
        formData.append('imgTitle', imgTitle)
        formData.append('name', oldName)
        formData.append('category', oldCatagory)
        formData.append('organization', oldOrganization)
        formData.append('description', oldDescription)
        //console.log(formData.get('imgTitle'))
        postData(formData)
        .then(res=>{
            
            //console.log(res.data.newTech)
            router.refresh()    
            router.push(`/objects/${obj._id}`)
        })
        .catch(e=>console.log(e))
        
    }

    const getImageSource = (icon) => {
        if (!icon?.data?.data) return '/imgsObj/Default.png'
        
        try {
            const buffer = Buffer.from(icon.data.data)
            const base64 = buffer.toString('base64')
            return `data:${icon.contentType};base64,${base64}`
        } catch (e) {
            console.error('Error converting image:', e)
            return '/imgsObj/Default.png'
        }
    }

    return <div className="editPanelObj">
        
        <button onClick={()=>router.push(`/objects/${obj._id}`)}>Назад</button>
        <div className='editImg'>
            {imgUrlCreare === null ? 
                <Image 
                    src={getImageSource(obj.icon)}
                    width={500} 
                    height={500} 
                    alt='editImg' 
                    priority
                    unoptimized
                    onError={() => {
                        setError(true)
                        console.error('Image load error')
                    }}
                />
                :
                <Image 
                    src={imgUrlCreare} 
                    width={500} 
                    height={500} 
                    alt='editImg' 
                    priority
                    unoptimized
                />
            }
            <input 
                type="file" 
                onChange={onTitleImageChange} 
                accept="image/png, image/jpeg"
                ref={inputFileRef}
            />
        </div>

        <div className='editDefaultState'>
            <input type='text' value={oldName} onChange={(e)=>setOldName(e.target.value)} placeholder='Название (имя)'/>
            <select onChange={(e)=>setOldCatagory(e.target.value)}>
                {filteredArray.map((item,index)=>{
                    return <option key={index} value={item}>{item}</option>
                })}
            </select>
            <input type='text' value={oldOrganization} onChange={(e)=>setOldorganization(e.target.value)} placeholder='Организация'/>
            <textarea value={oldDescription} onChange={(e)=>setOldDescription(e.target.value)} placeholder='Текст описания'/>
            
        </div> 
        <button onClick={sendData}>Редактировать</button>
    </div>
}   