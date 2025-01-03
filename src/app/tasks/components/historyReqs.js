import axios from "axios"
import react, { useState } from "react";
import { useEffect } from "react"

export default function HistoryReqs(){

    function formatDate(inputDate) {
        const parts = inputDate.split('.');
        if (parts.length !== 3) {
          return 'Некорректный формат даты';
        }
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        const formattedDate = `${year}-${month}-${day}`;
        return formattedDate;
    }

    //default
    const date = formatDate(new Date().toLocaleDateString())

    //react
    const [history, setHistory] = useState([])

    //function
    async function getHistory(date){
        return await axios.post('api/historyReqs',{date:date})
    }

    
    useEffect(()=>{
        getHistory(date)
        .then(res=>{
            setHistory(res.data)
        })
        .catch(e=>{})

    },[])

    return <>
        <input type="date" defaultValue={date} onChange={async e=>{ 
            getHistory(e.target.value)
            .then(res=>{
                setHistory(res.data)
            })
            .catch(e=>{})
        }}/>

        {history.length !== 0?
            history.map((item,index)=>{
                return <div className="historyReqsItem" key={index}>
                    {item._id}
                </div>
            })
        :'По данной дате заявок нет'}
    </>
}