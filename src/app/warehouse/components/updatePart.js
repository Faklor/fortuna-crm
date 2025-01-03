import Image from "next/image"
import { useState } from "react"
import axios from "axios"
import '../scss/editPanel.scss'

export default function UpdatePart({
    _id,
    name,
    catagory,
    contact,
    manufacturer,
    sellNumber,
    serialNumber,
    sum,
    setVisibleEditPanel, 
    catagoryes,
    setVisibleParts
}){
 
    //default operations
    let findDefaultCatagory = catagoryes.findIndex(item=>item === catagory)
    let filterCatagory = [...catagoryes]
    filterCatagory.splice(findDefaultCatagory,1)
    filterCatagory.unshift(catagory)
    //react
    const [editCatagory, setEditCatagory] = useState(catagory)
    const [editName, setEditName] = useState(name)
    const [editManufacturer, setEditManufacturer] = useState(manufacturer)
    const [editSellNumber, setEditSellNumber] = useState(sellNumber)
    const [editSerialNumber, setEditSerialNumber] = useState(serialNumber)
    const [editSum, setEditSum] = useState(sum)
    const [editContact_Name, setEditContact_Name] = useState(contact.name)
    const [editContact_Link, setEditContact_Link] = useState(contact.link)

    //default
    const partObj = {
        _id:_id,
        category:editCatagory,
        name:editName,
        serialNumber:editSerialNumber,
        sellNumber:editSellNumber,
        sum:Number(editSum),
        manufacturer:editManufacturer,
        contact:{
            name:editContact_Name,
            link:editContact_Link
        }
    }

    //functions
    async function editFullPart(editPart){
        return await axios.post('/api/parts/updatePart',editPart)
    }
    

    return <div className="editPanel">
        
        <button onClick={()=>setVisibleEditPanel(false)}>Отмена</button>
        <p>Редактирование Запчасти</p>
        <select onChange={e=>setEditCatagory(e.target.value)}>
            {filterCatagory.map((item,index)=>{
                return <option key={index} value={item}>{item}</option>
            })}
        </select>
        <input type="text" value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Название*"/>
        <input type="text" value={editManufacturer} onChange={e=>setEditManufacturer(e.target.value)} placeholder="Производитель"/>
        <input type="text" value={editSerialNumber} onChange={e=>setEditSerialNumber(e.target.value)} placeholder="Серийный номер"/>
        <input type="text" value={editSellNumber} onChange={e=>setEditSellNumber(e.target.value)} placeholder="Товарный номер"/>
        <input type="number" value={editSum} onChange={e=>setEditSum(e.target.value)} placeholder="Сумма"/>
        <p>Контакты</p>
        <input type="text" value={editContact_Name} onChange={e=>setEditContact_Name(e.target.value)} placeholder="Имя"/>
        <input type="text" value={editContact_Link} onChange={e=>setEditContact_Link(e.target.value)} placeholder="Ссылка"/>

        <button className="sendbtn" onClick={async ()=>{
            
            editFullPart(partObj)
            .then(res=>{
                //console.log(JSON.parse(res.data).data)
                setVisibleParts((prevParts) => {
                    const updatedParts = [...prevParts];
                    const index = updatedParts.findIndex((item) => item._id === _id);
                    if (index !== -1) {
                      updatedParts[index] = JSON.parse(res.data).data
                    }
                    return updatedParts;
                })
                // dispatch(updateCountPartAllClient(JSON.parse(res.data).data))
                // socket.send(res.data)

                // setVisibleEditPanel(false)
            })
            .catch(e=>{
                console.log(e)
            })

        }}>Редактировать</button>
    </div>
}