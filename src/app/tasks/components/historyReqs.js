import axios from "axios"
import react, { useState } from "react";
import { useEffect } from "react"
import '../scss/historyReqs.scss'
import Image from 'next/image'

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

    return <div className="history-container">
        <div className="history-header">
            <h2>Архив заявок</h2>
            <input 
                type="date" 
                defaultValue={date} 
                onChange={async e=>{ 
                    getHistory(e.target.value)
                    .then(res=>{
                        setHistory(res.data)
                    })
                    .catch(e=>{})
                }}
                className="date-picker"
            />
        </div>

        <div className="history-content">
            {history.length !== 0 ? (
                history.map((item, index) => (
                    <div className="history-item" key={index}>
                        <div className="history-item-header">
                            <div className="header-left">
                                <h3>Заявка #{item._id.$oid}</h3>
                                <span className={`status ${item.urgency.toLowerCase()}`}>
                                    {item.urgency}
                                </span>
                            </div>
                            <div className="header-right">
                                <div className="date-range">
                                    <span>С {item.dateBegin}</span>
                                    <span>По {item.dateEnd}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="history-item-details">
                            <div className="object-info">
                                <div className="object-header">
                                    {item.obj.catagory}
                                    <div className="object-title">
                                        <h4>{item.obj.name}</h4>
                                        <span className="organization">{item.obj.organization}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="parts-list">
                                <h4>Запчасти:</h4>
                                {item.parts.map((part, idx) => (
                                    <div className="part-item" key={idx}>
                                        <div className="part-header">
                                            <span className="part-name">{part.name}</span>
                                            <span className="part-category">{part.catagory}</span>
                                        </div>
                                        <div className="part-details">
                                            {part.manufacturer && (
                                                <span className="manufacturer">{part.manufacturer}</span>
                                            )}
                                            {part.sellNumber && (
                                                <span className="sell-number">Артикул: {part.sellNumber}</span>
                                            )}
                                            <div className="part-count">
                                                <span>Количество: {part.count}</span>
                                                {part.sum > 0 && (
                                                    <span className="sum">Сумма: {part.sum} руб.</span>
                                                )}
                                            </div>
                                            {part.contact.name && (
                                                <span className="contact">Поставщик: {part.contact.name}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="no-history">
                    <p>По данной дате заявок нет</p>
                </div>
            )}
        </div>
    </div>
}