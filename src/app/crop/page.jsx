import dbConnect from "@/lib/db";
import Seasons from "@/models/seasons";
import SubField from "@/models/subField";
import Fields from "@/models/fields";
import Works from "@/models/works";
import Applications from "@/models/historyReq";
import Operations from "@/models/operations";
import { unstable_cache } from 'next/cache'
import Image from "next/image";
import Link from "next/link";
//----------components------------
import PageClient from "./components/pageClient";



export const revalidate = 1
export const dynamic = "force-dynamic"

export default async function Page({searchParams}){

    //db
    await dbConnect()
    const seasons = await Seasons.find({})
    const fields = await Fields.find({})
    const subFields = await SubField.find({})
    const works = await Works.find({})
    const applications = await Applications.find({})
    const operations = await Operations.find({})


    //default
    let visibleSeasons = JSON.stringify(await seasons)
    let visibleFields = JSON.stringify(await fields)
    let visibleSubFields = JSON.stringify(await subFields)
    let visibleWorks = JSON.stringify(await works)
    let visibleApplications = JSON.stringify(await applications)
    let visibleOperations = JSON.stringify(await operations)


    return <PageClient
        seasons={visibleSeasons}
        fields={visibleFields}
        subFields={visibleSubFields}
        works={visibleWorks}
        applications={visibleApplications}
        operations={visibleOperations}
    />
       
}
