'use client'
import '../scss/updateCountPart.scss'
import Image from 'next/image'
import { useState } from 'react'
import axios from 'axios'

export default function UpdateCountPart({count,_id,setVisibleParts}){

    //react
    let [nowCount, setNowCount] = useState(count)

    //functions

    async function setCountPart(_id,count){
        return await axios.post('/api/parts/updateCountPart',{_id:_id,count:count})
    }

    async function handleCountChange(e) {
        const newCount = Number(e.target.value);
        try {
          const response = await setCountPart(_id, newCount);
          const updatedData = JSON.parse(response.data).data;
          setNowCount(updatedData.count);
          // Обновляем состояние parts, используя функцию обновления
          setVisibleParts((prevParts) => {
            const updatedParts = [...prevParts];
            const index = updatedParts.findIndex((item) => item._id === _id);
            if (index !== -1) {
              updatedParts[index] = { ...updatedParts[index], count: updatedData.count };
            }
            return updatedParts;
          });
        } catch (error) {
          console.error('Error updating count:', error);
        }
    }

    async function handleCountClickImgPlus(e) {
        const newCount = count+1;
        try {
          const response = await setCountPart(_id, newCount);
          const updatedData = JSON.parse(response.data).data;
          setNowCount(updatedData.count);
          // Обновляем состояние parts, используя функцию обновления
          setVisibleParts((prevParts) => {
            const updatedParts = [...prevParts];
            const index = updatedParts.findIndex((item) => item._id === _id);
            if (index !== -1) {
              updatedParts[index] = { ...updatedParts[index], count: updatedData.count };
            }
            return updatedParts;
          });
        } catch (error) {
          console.error('Error updating count:', error);
        }
    }
    async function handleCountClickImgDelete(e) {
        const newCount = count-1;
        try {
          const response = await setCountPart(_id, newCount);
          const updatedData = JSON.parse(response.data).data;
          setNowCount(updatedData.count);
          // Обновляем состояние parts, используя функцию обновления
          setVisibleParts((prevParts) => {
            const updatedParts = [...prevParts];
            const index = updatedParts.findIndex((item) => item._id === _id);
            if (index !== -1) {
              updatedParts[index] = { ...updatedParts[index], count: updatedData.count };
            }
            return updatedParts;
          });
        } catch (error) {
          console.error('Error updating count:', error);
        }
    }

    return <div className='count'>
        <input type='text' value={count} onChange={handleCountChange}/>
        <div className='controllers'>
            <Image src={'/components/add.svg'} width={35} height={35} alt='addCount' onClick={handleCountClickImgPlus}/>
            <Image src={'/components/remove.svg'} width={35} height={35} alt='deleteCount' onClick={handleCountClickImgDelete}/>  
        </div>
        
    </div>
}