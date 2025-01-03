import dbConnect from "@/lib/db";
import Parts from "@/models/parts";
import Workers from "@/models/workers";
import Tech from "@/models/tech";
import { unstable_cache } from 'next/cache'
import Image from "next/image";
import Link from "next/link";
//----------components------------
import ListParts from "./components/ListParts";



export const revalidate = 1
export const dynamic = "force-dynamic"

export default async function Page({}){
    
    //db
    await dbConnect()
    const parts = await Parts.find({})
    const workers = await Workers.find({})
    const objects = await Tech.find({})
    //default
    let visibleParts = JSON.stringify(await parts)
    let visibleWorkers = JSON.stringify(await workers)
    let visibleObjects = JSON.stringify(await objects)

    
    // return <ListParts parts={visibleArr}/>   
    return <ListParts parts={visibleParts} workers={visibleWorkers} objects={visibleObjects}/>
}


