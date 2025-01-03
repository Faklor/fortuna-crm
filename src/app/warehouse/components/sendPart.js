import Image from 'next/image'

export default function SendPart({count,setSendVisible}){


    return  count !== 0?
    <button onClick={()=>{setSendVisible(true)}}><Image src={'/components/send.svg'} width={34} height={34} alt='sendPart'/></button>
    :<></>
}