'use client'
import { useRef,useState } from 'react';
import '../scss/historyOperations.scss'

//-------------components-----------
import Operation from './operation';
import AddOperation from './addOperation'


export default function HistoryOperation({visibleOperation, category, objectID}){
    
    //default
    const [operations, setOperations] = useState(JSON.parse(visibleOperation))
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
    const { _id, date, type, description, periodMotor } = item
    let periodMotorCheck = periodMotor?periodMotor:''
    const operationDate = new Date(date);
        
    // Сравниваем даты
        if (operationDate <= currentDate) {
            // Дата прошедшая или равна текущей дате
            if (!uniqueDates[date]) {
                uniqueDates[date] = { date: formatDate(date), data: [{ _id, date, type, description, periodMotorCheck }] };
            } else {
                uniqueDates[date].data.push({ _id, date, type, description, periodMotorCheck });
            }    
        }
    })
    

    let sortArray = Object.values(uniqueDates).reverse()
    

    return <div className="historyOperations" > 
        <AddOperation objectID={objectID} setOperations={setOperations}/>
        {operations.length?
        sortArray.map((item,index)=>{
            return <div className='operations' key={index}>
                <h2 className='titleOperation'>{item.date}</h2>
                {item.data.map((operation,index)=>{
                    
                    return <Operation {...operation}  
                        operations={operations} 
                        key={index} 
                        refText={textAreaRef} 
                        index={index} 
                        category={category} 
                        
                        setOperations={setOperations}
                    />
                })}
            </div> 
        }):
        <p>Нет записей</p>}
    </div>
}