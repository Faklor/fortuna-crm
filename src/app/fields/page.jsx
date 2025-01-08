import dbConnect from "@/lib/db";
import Seasons from "@/models/seasons";
import Works from "@/models/works";
import Fields from "@/models/fields";
import { unstable_cache } from 'next/cache'
import Image from "next/image";
import Link from "next/link";
//----------components------------
import PageClient from "./PageClient";



export const revalidate = 1
export const dynamic = "force-dynamic"

export default async function Page({searchParams}){

    //db
    await dbConnect()
    const seasons = await Seasons.find({})
    const allFields = await Fields.find({})
    const allWorks = await Works.find({})

    if((await searchParams).season){
        // seasons = await Seasons
        // (await searchParams).season
    }
    
   
   
    //default
    let visibleArr = JSON.stringify(await seasons)
    let visibleAllFields = JSON.stringify(await allFields)
    let visibleAllWorks = JSON.stringify(await allWorks)

    return <PageClient visibleArr={visibleArr} allFields={visibleAllFields} allWorks={visibleAllWorks}/> 
       
}


