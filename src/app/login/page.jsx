'use client'
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './scss/loginPage.scss';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      login,  // Изменено с email на login
      password,
      redirect: false
    });


    if (result.error) {
      setError('Неверный логин или пароль');
    } else {
      router.push('/tasks'); // или куда вам нужно после входа
    }
  };

  return <div className='login-page'>
    <Image src='/main/main.svg' alt='logo' width={100} height={100} priority/>
    {/* <h1>Там, где удача встречается с качеством</h1> */}
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="login">Логин:</label>
        <input
          type="text"
          id="login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Пароль:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit">Войти</button>
    </form>
  </div>
}