import dbConnect from "@/lib/db";
import Workers from "@/models/workers";

//----------components------------
import WorkersList from './components/workersList'


export const revalidate = 1
export const dynamic = "force-dynamic"

export default async function Page({}){
    
    //db
    await dbConnect()
    const workers = await Workers.find({})
    //default 
    let visibleWorkers = JSON.stringify(await workers)
    return <WorkersList 
        visibleWorkers={visibleWorkers}
    />
}


