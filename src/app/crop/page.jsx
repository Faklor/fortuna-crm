import dbConnect from "@/lib/db";
import Seasons from "@/models/seasons";
import { unstable_cache } from 'next/cache'
import Image from "next/image";
import Link from "next/link";
//----------components------------



export const revalidate = 1
export const dynamic = "force-dynamic"

export default async function Page({searchParams}){

    //db
    await dbConnect()
    const seasons = await Seasons.find({})


    if((await searchParams).season){
        // seasons = await Seasons
        // (await searchParams).season
    }
    
   
   
    //default
    let visibleArr = JSON.stringify(await seasons)

    return 
       
}
