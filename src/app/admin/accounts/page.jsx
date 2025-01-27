'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import './scss/accounts.scss'

export default function AccountsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState([])
    const [newUser, setNewUser] = useState({
        login: '',
        password: '',
        role: 'worker'
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Проверяем права доступа
    useEffect(() => {
        if (status === 'loading') return

        if (!session || session.user.role !== 'admin') {
            router.push('/login')
        } else {
            fetchUsers()
        }
    }, [session, status, router])

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users')
            setUsers(response.data)
        } catch (error) {
            setError('Ошибка при загрузке пользователей')
        }
    }

    // Если сессия загружается, показываем загрузку
    if (status === 'loading') {
        return <div>Загрузка...</div>
    }

    // Если нет прав доступа, ничего не рендерим (редирект выполнится в useEffect)
    if (!session || session.user.role !== 'admin') {
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        try {
            await axios.post('/api/users', newUser)
            setSuccess('Пользователь успешно создан')
            setNewUser({ login: '', password: '', role: 'worker' })
            fetchUsers()
        } catch (error) {
            setError(error.response?.data?.error || 'Ошибка при создании пользователя')
        }
    }

    return (
        <div className="accounts-page">
            <h1>Управление аккаунтами</h1>

            {/* Форма создания пользователя */}
            <div className="create-account-form">
                <h2>Создать новый аккаунт</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Логин:</label>
                        <input
                            type="text"
                            value={newUser.login}
                            onChange={(e) => setNewUser({...newUser, login: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Пароль:</label>
                        <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Роль:</label>
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        >
                            <option value="worker">Работник</option>
                            <option value="manager">Менеджер</option>
                            <option value="warehouse">Кладовщик</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <button type="submit">Создать аккаунт</button>
                </form>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
            </div>

            {/* Список пользователей */}
            <div className="users-list">
                <h2>Существующие аккаунты</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Логин</th>
                            <th>Роль</th>
                            <th>Дата создания</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.login}</td>
                                <td>{user.role}</td>
                                <td>{new Date(user.createdAt).toLocaleDateString('ru')}</td>
                                <td>{user.active ? 'Активен' : 'Неактивен'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
} 