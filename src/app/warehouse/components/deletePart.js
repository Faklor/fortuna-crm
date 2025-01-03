import Image from 'next/image'
import axios from 'axios'

export default function DeletePart({_id, setVisibleParts}){
    
   

    //functions
    async function deletePart(_id) {
        return await axios.post('/api/parts/deletePart',{_id:_id})
    }


    return <button>
        <Image src={'/components/delete.svg'} width={34} height={34} alt='deletePart' onClick={async ()=>{
            deletePart(_id)
            .then(res=>{
                setVisibleParts((prevParts) => prevParts.filter((part) => part._id !== _id))
                //console.log(res.data)
            })
            .catch(e=>{})
        }}/>
    </button>
}