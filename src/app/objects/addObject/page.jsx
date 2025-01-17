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
    const [captureWidth, setCaptureWidth] = useState('')

    //functions
    function onTitleImageChange(e){
        if (e.target.files && e.target.files[0]) {
            setTimeIcon(URL.createObjectURL(e.target.files[0]))
            setIcon(e.target.files[0])
        }
    }
    async function postData(formdata){
        return await axios.post('/api/teches/object/add', formdata, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
    }
    async function sendData(e) {
        e.preventDefault();
        
        if (!name.trim()) {
            alert('Пожалуйста, введите название объекта');
            return;
        }

        if (!category || category === 'Выберите категорию') {
            alert('Пожалуйста, выберите категорию');
            return;
        }
        
        const formData = new FormData()
        
        if (icon) {
            if (icon.size > 5 * 1024 * 1024) {
                alert('Размер файла не должен превышать 5MB');
                return;
            }
            
            if (!icon.type.match('image/(jpeg|png|jpg)')) {
                alert('Допустимы только изображения в форматах JPEG и PNG');
                return;
            }
            
            formData.append('icon', icon)
        } else {
            formData.append('icon', 'null')
        }
        
        formData.append('name', name)
        formData.append('category', category)
        formData.append('organization', organization)
        formData.append('description', description)
        
        if (category === '🚃 Прицепы') {
            
            if (captureWidth.trim() !== '') {
                const numericCaptureWidth = parseFloat(captureWidth);
                
                if (!isNaN(numericCaptureWidth)) {
                    formData.append('captureWidth', numericCaptureWidth.toString());
                }
            }
        }
        
        
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }
        
        try {
            const response = await postData(formData)
            router.push('/objects')
        } catch (error) {
            
            if (error.response?.data?.error) {
                alert(`Ошибка: ${error.response.data.error}`)
            } else {
                alert('Произошла ошибка при сохранении объекта')
            }
        }
    }
   


    return <div className='addObject'>
        <button onClick={()=>router.push('/objects')}>Отмена</button>

        {icon === null?
        <Image src={`/imgsObj/Default.png`} width={300} height={300} alt='editImg' priority/>
        :<Image src={timeIcon} width={300} height={300} alt='editImg'/>}

        <input type="file" onChange={onTitleImageChange} accept="image/png, image/jpeg"/>

        <input type='text' value={name} onChange={e=>setName(e.target.value)} placeholder='Название ( имя )'/>
        <select value={category} onChange={e=>setCategory(e.target.value)}>
            {filteredArray.map((item,index)=>{
                return <option key={index} value={item}>{item}</option>
            })}
        </select>
        
        {category === '🚃 Прицепы' && (
            <div className="capture-width-container">
                <label className="capture-width-label">
                    Ширина захвата
                </label>
                <input 
                    type="number" 
                    value={captureWidth} 
                    onChange={e => {
                        // Ограничиваем количество десятичных знаков до одного
                        const value = e.target.value;
                        if (value.includes('.')) {
                            const [whole, decimal] = value.split('.');
                            if (decimal && decimal.length > 1) {
                                setCaptureWidth(whole + '.' + decimal.slice(0, 1));
                                return;
                            }
                        }
                        setCaptureWidth(value);
                    }}
                    className="capture-width-input"
                    placeholder="Укажите ширину захвата"
                    step="0.1"
                    min="0"
                    max="100"
                />
                <span className="capture-width-unit">м</span>
            </div>
        )}

        <input type='text' value={organization} onChange={e=>setOrganization(e.target.value)} placeholder='Организация'/>
        <textarea type='text' value={description} onChange={e=>setDescription(e.target.value)} placeholder='Описание'/>

        <button onClick={sendData}> Добавить </button>
    </div>
}