'use client'
import { useState, useEffect } from 'react'
import { 
    Chart as ChartJS, 
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import '../scss/statisticsCharts.scss'
import axios from 'axios'

// Регистрируем компоненты Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

const StatisticsCharts = ({ operations, orders, requests, parts, objects, startDate, endDate }) => {
    const [stats, setStats] = useState({
        partsStats: {
            total: 0,
            inStock: 0,
            outOfStock: 0,
            byCategory: null
        },
        requestsByObject: null,
        ordersByObject: null,
        expensesByObject: null,
        totalOperations: 0,
        totalOrders: 0,
        totalExpenses: 0
    })

    useEffect(() => {
        // Фильтруем данные по периоду
        const filteredOperations = operations?.filter(op => 
            new Date(op.date) >= startDate && new Date(op.date) <= endDate
        )
        
        const filteredOrders = orders?.filter(order => 
            new Date(order.date) >= startDate && new Date(order.date) <= endDate
        )
        
        const filteredRequests = requests?.filter(req => 
            new Date(req.dateEnd) >= startDate && new Date(req.dateEnd) <= endDate
        )

        // Статистика по запчастям
        const partsStats = parts?.reduce((acc, part) => {
            // Общая статистика
            acc.total++;
            if (part.count > 0) {
                acc.inStock++;
            } else {
                acc.outOfStock++;
            }

            // По категориям
            const category = part.catagory || 'Другое';
            if (!acc.categories[category]) {
                acc.categories[category] = 0;
            }
            acc.categories[category]++;

            return acc;
        }, { total: 0, inStock: 0, outOfStock: 0, categories: {} });

        // Статистика заявок по объектам
        const requestStats = filteredRequests?.reduce((acc, req) => {
            const objectId = req.obj?._id;
            const object = objects?.find(obj => obj._id === objectId);
            const objectName = object ? `${object.name}` : 'Неизвестный';
            acc[objectName] = (acc[objectName] || 0) + 1;
            return acc;
        }, {});

        // Статистика выданных запчастей по объектам
        const orderStats = filteredOrders?.reduce((acc, order) => {
            const objectId = order.objectID;
            const object = objects?.find(obj => obj._id === objectId);
            const objectName = object ? `${object.name}` : 'Неизвестный';
            // Учитываем количество выданных запчастей
            acc[objectName] = (acc[objectName] || 0) + (order.countPart || 1);
            return acc;
        }, {});

        // Статистика затрат по объектам
        const expensesStats = filteredOrders?.reduce((acc, order) => {
            const objectId = order.objectID;
            const object = objects?.find(obj => obj._id === objectId);
            const objectName = object ? `${object.name}` : 'Неизвестный';
            
            // Получаем стоимость запчасти если она есть
            const partCost = order.part?.sum || 0;
            const totalCost = partCost * (order.countPart || 1);
            
            acc.byObject[objectName] = (acc.byObject[objectName] || 0) + totalCost;
            acc.total += totalCost;
            
            return acc;
        }, { byObject: {}, total: 0 });

        // Сортируем объекты по количеству заявок
        const sortedRequestStats = Object.fromEntries(
            Object.entries(requestStats || {}).sort(([, a], [, b]) => b - a)
        );

        // Сортируем объекты по количеству выданных запчастей
        const sortedOrderStats = Object.fromEntries(
            Object.entries(orderStats || {}).sort(([, a], [, b]) => b - a)
        );

        // Сортируем объекты по сумме затрат
        const sortedExpensesStats = Object.fromEntries(
            Object.entries(expensesStats?.byObject || {}).sort(([, a], [, b]) => b - a)
        );

        // Отправляем уведомление в Telegram о новых данных
        const sendStatisticsNotification = async () => {
            try {
                
            } catch (error) {
                console.error('Failed to send statistics notification:', error);
            }
        };

        sendStatisticsNotification();

        setStats({
            partsStats: {
                total: partsStats?.total || 0,
                inStock: partsStats?.inStock || 0,
                outOfStock: partsStats?.outOfStock || 0,
                byCategory: {
                    labels: Object.keys(partsStats?.categories || {}),
                    datasets: [{
                        data: Object.values(partsStats?.categories || {}),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 1
                    }]
                }
            },
            requestsByObject: {
                labels: Object.keys(sortedRequestStats),
                datasets: [{
                    label: 'Количество заявок',
                    data: Object.values(sortedRequestStats),
                    backgroundColor: '#84E168',
                    borderColor: '#84E168',
                    borderWidth: 1
                }]
            },
            ordersByObject: {
                labels: Object.keys(sortedOrderStats),
                datasets: [{
                    label: 'Выдано запчастей',
                    data: Object.values(sortedOrderStats),
                    backgroundColor: '#36A2EB',
                    borderColor: '#36A2EB',
                    borderWidth: 1
                }]
            },
            expensesByObject: {
                labels: Object.keys(sortedExpensesStats),
                datasets: [{
                    label: 'Затраты (руб)',
                    data: Object.values(sortedExpensesStats),
                    backgroundColor: '#FA5C62',
                    borderColor: '#FA5C62',
                    borderWidth: 1
                }]
            },
            totalOperations: filteredOperations?.length || 0,
            totalOrders: filteredOrders?.length || 0,
            totalExpenses: expensesStats?.total || 0
        });
    }, [operations, orders, requests, parts, objects, startDate, endDate]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: 8,
                    font: { size: 11 }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 10 }
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    font: { size: 10 }
                }
            }
        }
    };

    return (
        <div className="statistics-charts">
            <h2>Статистика</h2>
            
            <div className="summary-stats">
                <div className="stat-card">
                    <h3>Запчасти</h3>
                    <div className="stat-numbers">
                        <div>Всего: {stats.partsStats.total}</div>
                        <div className="in-stock">В наличии: {stats.partsStats.inStock}</div>
                        <div className="out-of-stock">Шаблонов: {stats.partsStats.outOfStock}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <h3>Общая статистика</h3>
                    <div className="stat-numbers">
                        <div>Всего операций: {stats.totalOperations}</div>
                        <div>Всего выдано: {stats.totalOrders}</div>
                        <div className="expenses">Общие затраты: {stats.totalExpenses.toFixed(2)} руб</div>
                    </div>
                </div>
            </div>
            
            <div className="charts-grid">
                {/* График запчастей по категориям */}
                <div className="chart-container">
                    <h3>Запчасти по категориям</h3>
                    {stats.partsStats.byCategory && (
                        <Pie data={stats.partsStats.byCategory} options={options} />
                    )}
                </div>

                {/* График заявок по объектам */}
                <div className="chart-container">
                    <h3>Заявки по объектам</h3>
                    {stats.requestsByObject && (
                        <Bar data={stats.requestsByObject} options={options} />
                    )}
                </div>

                {/* График выданных запчастей по объектам */}
                <div className="chart-container">
                    <h3>Выдано запчастей по объектам</h3>   
                    {stats.ordersByObject && (
                        <Bar data={stats.ordersByObject} options={options} />
                    )}
                </div>

                {/* График затрат по объектам */}
                <div className="chart-container">
                    <h3>Затраты по объектам</h3>   
                    {stats.expensesByObject && (
                        <Bar data={stats.expensesByObject} options={{
                            ...options,
                            scales: {
                                ...options.scales,
                                y: {
                                    ...options.scales.y,
                                    ticks: {
                                        ...options.scales.y.ticks,
                                        callback: (value) => `${value.toFixed(0)} руб`
                                    }
                                }
                            }
                        }} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatisticsCharts; 