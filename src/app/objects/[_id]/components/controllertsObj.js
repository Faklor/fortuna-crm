'use client'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from "next/navigation";
import '../scss/controllersObj.scss'

export default function ControllersObj({_id}){

    
    //next
    const router = useRouter()
    //functions
    async function deleteObj(_id){
        return await axios.post('/api/teches/object/delete',{_id:_id})
    }

    return <div className='controllersObj'>
        <button onClick={()=>{
            router.push(`/objects/${_id}?name=editObj`)
        }}><Image src={'/components/edit.svg'} width={30} height={30} alt='updateObject'/></button>
        <button onClick={()=>{
            let result = confirm('Удалить объект? ( после его удаления, будут утеряны данные по выданным запчастям, операциям и другие... )')
            if(result){
                deleteObj(_id)
                .then(res=>{
                    return router.push('/objects',undefined,{shallow:true})
                })
                .catch(e=>console.log(e))
            }
             
        }}><Image src={'/components/delete.svg'} width={30} height={30} alt='deleteObject'/></button>
    </div>
}