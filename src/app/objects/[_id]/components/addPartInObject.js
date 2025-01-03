import Image from "next/image"

export default function AddPartInObject(){
    return <div className="addPartInObject">
        <Image src={require('@/res/components/Add.svg')} alt="add_Part"/>
    </div>
}