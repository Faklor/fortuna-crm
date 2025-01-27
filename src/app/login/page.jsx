'use client'
import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './scss/loginPage.scss';
import AnimatedLogo from '../components/AnimatedLogo';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const animRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false
      });

      if (result.error) {
        setError('Неверный логин или пароль');
        setIsLoading(false);
      } else {
        setShowAnimation(true);
        // Добавляем небольшую задержку для плавного появления анимации
        setTimeout(() => {
          if (animRef.current) {
            animRef.current.style.transform = 'scale(1)';
          }
          // Даем время на проигрывание анимации перед редиректом
          setTimeout(() => {
            router.push('/tasks');
            router.refresh();
          }, 1500); // Время анимации
        }, 100);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Ошибка авторизации');
      setIsLoading(false);
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}