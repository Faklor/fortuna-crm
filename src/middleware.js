export { default } from 'next-auth/middleware'

export const config = { matcher: [
    // Защищаем основные маршруты и их дочерние пути
    '/tasks/:path*',
    '/objects/:path*', 
    '/warehouse/:path*',
    '/fields/:path*',
    // Защищаем API маршруты, кроме auth
    '/api/((?!auth).*)/:path*'
]}