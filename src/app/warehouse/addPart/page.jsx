'use client'
import './scss/blockAddPart.scss'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import axios from 'axios'

//-------components--------


export default function BlockAddPart({}){

    //navigation
    const router = useRouter()
    
    //react
    const [nowCatagory, setNowCatagory] = useState('')
    const [nowName, setNowName] = useState('')
    const [nowSerialNumber, setNowSerialNumber] = useState('')
    const [nowSellNumber, setNowSellNumber] = useState('')
    const [nowCount, setNowCount] = useState('')
    const [nowSell, setNowSell] = useState('')
    const [nowManufacturer, setNowManufacturer] = useState('')
    const [nowContact_Name, setNowContact_Name] = useState('')
    const [nowContact_Link, setNowContact_Link] = useState('')
    const [nowStorageId, setNowStorageId] = useState('')
    //------
    const [status, setStatus] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [categoryes, setCategoryes] = useState([])

    // Добавляем новые состояния
    const [existingManufacturers, setExistingManufacturers] = useState([])
    const [existingStorageIds, setExistingStorageIds] = useState([])
    const [existingContactNames, setExistingContactNames] = useState([])
    
    const [isCustomManufacturer, setIsCustomManufacturer] = useState(false)
    const [isCustomStorageId, setIsCustomStorageId] = useState(false)
    const [isCustomContactName, setIsCustomContactName] = useState(false)

    //default
    const partObj = {
        category:nowCatagory,
        name:nowName,
        serialNumber:nowSerialNumber,
        sellNumber:nowSellNumber,
        count:Number(nowCount),
        sum:Number(nowSell),
        manufacturer:nowManufacturer,
        contact:{
            name:nowContact_Name,
            link:nowContact_Link
        },
        storageId:nowStorageId
    }

    const clearForm = () => {
        setNowName('')
        setNowSerialNumber('')
        setNowSellNumber('')
        setNowCount('')
        setNowSell('')
        setNowManufacturer('')
        setNowContact_Name('')
        setNowContact_Link('')
        setNowStorageId('')
        // Сбрасываем категорию на первую в списке
        // if (categoryes.length > 0) {
        //     setNowCatagory(categoryes[0])
        // }
    }
    
    //functions
    async function getParts(){
        return await axios.get('/api/parts')
    }

    useEffect(()=>{
        getParts()
            .then(res => {
                let array_categoryes = []
                res.data.forEach((item)=>{
                    array_categoryes.push(item.catagory)
                })

                let filteredArray = [...new Set(array_categoryes)]

                setCategoryes(filteredArray)
                setNowCatagory(filteredArray[0])

                // Получаем уникальные значения из существующих запчастей
                const manufacturers = [...new Set(res.data.map(item => item.manufacturer))]
                    .filter(Boolean)
                const storageIds = [...new Set(res.data.map(item => item.storageId))]
                    .filter(Boolean)
                const contactNames = [...new Set(res.data.map(item => item.contact?.name))]
                    .filter(Boolean)

                setExistingManufacturers(manufacturers)
                setExistingStorageIds(storageIds)
                setExistingContactNames(contactNames)
            })
            .catch(e=>{
                setStatus('Ошибка загрузки категорий')
            })
    },[])

    
    //functions
    async function getParts() {
        return await axios.get('/api/parts')
    }
    async function addPart(partObj) {
        return await axios.post('/api/parts/addPart',partObj)
    }

    const handleSubmit = async () => {
        try {
            const res = await axios.post('/api/parts/addPart', partObj)
            setStatus('Успешно добавлено!')
            setShowSuccess(true)
            
            // Анимация успеха
            setTimeout(() => {
                setShowSuccess(false)
                clearForm()
            }, 2000)
        } catch (e) {
            setStatus('Ошибка при добавлении')
            setTimeout(() => {
                setStatus('')
            }, 3000)
        }
    }

    return <div className='blockAddPart'>
        <button onClick={()=>router.push('/warehouse')}>Вернуться на склад</button>   
        <h2>Добавление запчасти</h2>
        
        {/* Анимация успешного добавления */}
        {showSuccess && (
            <div className="success-animation">
                <div className="success-checkmark">
                    <div className="check-icon">
                        <span className="icon-line line-tip"></span>
                        <span className="icon-line line-long"></span>
                    </div>
                </div>
                <p>Успешно добавлено!</p>
            </div>
        )}
        
        <select onChange={(e)=>{setNowCatagory(e.target.value)}}>
            {categoryes.map((item,index)=>{
                return <option key={index}>{item}</option>
            })}
        </select>

        <input type='text' value={nowName} onChange={(e)=>{setNowName(e.target.value)}} placeholder='Название*'/>
        
        {/* Заменяем input производителя */}
        <div className="input-group">
            {!isCustomManufacturer ? (
                <div className="select-group">
                    <select
                        value={nowManufacturer}
                        onChange={(e) => setNowManufacturer(e.target.value)}
                    >
                        <option value="">Выберите производителя</option>
                        {existingManufacturers.map((manufacturer, index) => (
                            <option key={index} value={manufacturer}>{manufacturer}</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => setIsCustomManufacturer(true)}>+</button>
                </div>
            ) : (
                <div className="input-group">
                    <input
                        type="text"
                        value={nowManufacturer}
                        onChange={(e) => setNowManufacturer(e.target.value)}
                        placeholder="Производитель"
                    />
                    <button type="button" onClick={() => setIsCustomManufacturer(false)}>←</button>
                </div>
            )}
        </div>

        <input type='text' value={nowSerialNumber} onChange={(e)=>{setNowSerialNumber(e.target.value)}} placeholder='Серийный номер'/>
        <input type='text' value={nowSellNumber} onChange={(e)=>{setNowSellNumber(e.target.value)}} placeholder='Товарный номер'/>
        <input type='number' value={nowCount} onChange={(e)=>{setNowCount(e.target.value)}} placeholder='Кол-во'/>
        <input type='number' value={nowSell} onChange={(e)=>{setNowSell(e.target.value)}} placeholder='Сумма'/>
        
        {/* Заменяем input идентификатора */}
        <div className="input-group">
            {!isCustomStorageId ? (
                <div className="select-group">
                    <select
                        value={nowStorageId}
                        onChange={(e) => setNowStorageId(e.target.value)}
                    >
                        <option value="">Выберите идентификатор</option>
                        {existingStorageIds.map((id, index) => (
                            <option key={index} value={id}>{id}</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => setIsCustomStorageId(true)}>+</button>
                </div>
            ) : (
                <div className="input-group">
                    <input
                        type="text"
                        value={nowStorageId}
                        onChange={(e) => setNowStorageId(e.target.value)}
                        placeholder="Индификатор на складе"
                    />
                    <button type="button" onClick={() => setIsCustomStorageId(false)}>←</button>
                </div>
            )}
        </div>

        <h2>Контакты</h2>
        {/* Контактное имя */}
        <div className="input-group">
            {!isCustomContactName ? (
                <div className="select-group">
                    <select
                        value={nowContact_Name}
                        onChange={(e) => setNowContact_Name(e.target.value)}
                    >
                        <option value="">Выберите контактное лицо</option>
                        {existingContactNames.map((name, index) => (
                            <option key={index} value={name}>{name}</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => setIsCustomContactName(true)}>+</button>
                </div>
            ) : (
                <div className="input-group">
                    <input
                        type="text"
                        value={nowContact_Name}
                        onChange={(e) => setNowContact_Name(e.target.value)}
                        placeholder="Введите имя"
                    />
                    <button type="button" onClick={() => setIsCustomContactName(false)}>←</button>
                </div>
            )}
        </div>
        <input type='text' value={nowContact_Link} onChange={(e)=>{setNowContact_Link(e.target.value)}} placeholder='Ссылка'/>

        <button onClick={handleSubmit}>ДОБАВИТЬ</button>

    </div>
}