'use client'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from "next/navigation";
import '../scss/controllersObj.scss'
import DialogModal from '@/app/fields/components/DialogModal'
import { useState } from 'react'

export default function ControllersObj({_id}){
    const [dialog, setDialog] = useState({ isOpen: false });
    const router = useRouter()

    async function deleteObj(_id){
        return await axios.post('/api/teches/object/delete',{_id:_id})
    }

    return <>
        <div className='controllersObj'>
            <button onClick={()=>{
                router.push(`/objects/${_id}?name=editObj`)
            }}><Image src={'/components/edit.svg'} width={30} height={30} alt='updateObject'/></button>
            <button onClick={()=>{
                setDialog({
                    isOpen: true,
                    type: 'confirm',
                    title: 'Подтверждение',
                    message: 'Удалить объект? (после его удаления, будут утеряны данные по выданным запчастям, операциям и другие...)',
                    onConfirm: () => {
                        deleteObj(_id)
                            .then(res => {
                                setDialog({
                                    isOpen: true,
                                    type: 'alert',
                                    title: 'Успешно',
                                    message: 'Объект успешно удален',
                                    onConfirm: () => {
                                        setDialog(prev => ({ ...prev, isOpen: false }));
                                        router.push('/objects', undefined, {shallow: true});
                                    }
                                });
                            })
                            .catch(e => {
                                console.log(e);
                                setDialog({
                                    isOpen: true,
                                    type: 'alert',
                                    title: 'Ошибка',
                                    message: 'Ошибка при удалении объекта',
                                    onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                                });
                            });
                    },
                    onClose: () => setDialog(prev => ({ ...prev, isOpen: false }))
                });
            }}><Image src={'/components/delete.svg'} width={30} height={30} alt='deleteObject'/></button>
        </div>

        <DialogModal
            isOpen={dialog.isOpen}
            type={dialog.type}
            title={dialog.title}
            message={dialog.message}
            onConfirm={dialog.onConfirm}
            onClose={dialog.onClose}
        />
    </>
}