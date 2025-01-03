import dbConnect from "@/lib/db";
import Tech from "@/models/tech";
import { unstable_cache } from 'next/cache'
import Image from "next/image";
import Link from "next/link";
//----------components------------
import ListObjects from "./components/listObjects";



export const revalidate = 1
export const dynamic = "force-dynamic"

export default async function Page({}){
    
    //db
    await dbConnect()
    const objects = await Tech.find({})
    //default
    let visibleArr = JSON.stringify(await objects)

    return <ListObjects objects={visibleArr}/> 
       
}


