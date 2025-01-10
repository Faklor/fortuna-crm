'use client'
import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './scss/loginPage.scss';
import AnimatedLogo from '../components/AnimatedLogo';

export default function LoginPage() {
  const router = useRouter();
  const animRef = useRef(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      login,
      password,
      redirect: false
    });

    if (result.error) {
      setError('Неверный логин или пароль');
    } else {
      setShowAnimation(true);
      setTimeout(() => {
        animRef.current.style.transform = 'scale(1)';
      }, 100);

      setTimeout(() => {
        router.push('/tasks');
      }, 5000);
    }
  };

  if (showAnimation) {
    return (
      <div className='animation-container' ref={animRef}>
        <AnimatedLogo />
      </div>
    );
  }

  return (
    <div className='login-page'>
      <Image src='/main/main.svg' alt='logo' width={100} height={100} priority/>
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
  );
}