'use client'
import { useRef,useState, useEffect } from 'react';
import '../scss/historyOperations.scss'

//-------------components-----------
import Operation from './operation';
import AddOperation from './addOperation'


export default function HistoryOperation({
    visibleOperation, 
    category, 
    objectID,
    visibleWorkers,
    visibleParts
}){
    
    const [operations, setOperations] = useState(JSON.parse(visibleOperation))
    const workers = JSON.parse(visibleWorkers)
    const parts = JSON.parse(visibleParts)
    
    //useRef
    const textAreaRef = useRef([]) 
    //functions
    //console.log(operations)
    const uniqueDates = {}
    const currentDate = new Date();

    function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('ru-RU', options)
    }

    operations.sort((a, b) => new Date(a.date) - new Date(b.date))

    operations.forEach(item => {
        const { _id, date, type, description, periodMotor, executors, usedParts, createdBy } = item
        let periodMotorCheck = periodMotor ? periodMotor : ''
        const operationDate = new Date(date);
            
        if (operationDate <= currentDate) {
            if (!uniqueDates[date]) {
                uniqueDates[date] = { 
                    date: formatDate(date), 
                    data: [{
                        _id, 
                        date, 
                        type, 
                        description, 
                        periodMotorCheck,
                        executors,
                        usedParts,
                        createdBy
                    }] 
                };
            } else {
                uniqueDates[date].data.push({
                    _id, 
                    date, 
                    type, 
                    description, 
                    periodMotorCheck,
                    executors,
                    usedParts,
                    createdBy
                });
            }    
        }
    })
    

    let sortArray = Object.values(uniqueDates).reverse()
    
    useEffect(() => {
        setOperations(JSON.parse(visibleOperation))
    }, [visibleOperation])

    return <div className="historyOperations" > 
        <AddOperation 
            objectID={objectID} 
            setOperations={setOperations}
            category={category}
            workers={workers}
            parts={parts}
        />
        {operations.length ?
            <div className="operations-accordion">
                {sortArray.map((item,index)=>{
                    return (
                        <details className='operations-item' key={index}>
                            <summary className='operations-header'>
                                <span className="operations-date">{item.date}</span>
                                <span className="operations-count">{item.data.length}</span>
                            </summary>
                            <div className='operations-content'>
                                {item.data.map((operation,index)=>{
                                    return <Operation {...operation}  
                                        operations={operations} 
                                        key={index} 
                                        refText={textAreaRef} 
                                        index={index} 
                                        category={category} 
                                        setOperations={setOperations}
                                        workers={workers}
                                        parts={parts}
                                        objectID={objectID}
                                    />
                                })}
                            </div>
                        </details> 
                    )
                })}
            </div>
        : <p className="no-operations">Нет записей</p>}
    </div>
}