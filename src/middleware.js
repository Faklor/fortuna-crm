import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        // Правила доступа в зависимости от роли
        if (token?.role === 'admin') {
            // Админ имеет доступ ко всем страницам
            return NextResponse.next()
        }

        // Проверки для остальных ролей
        const restrictedPaths = {
            worker: ['/admin/accounts', '/workers'],
            warehouse: ['/admin/accounts', '/workers', '/fields', '/crop'],
            manager: ['/admin/accounts']
        }

        // Получаем список запрещенных путей для текущей роли
        const restrictedForRole = restrictedPaths[token?.role] || []

        // Проверяем, не пытается ли пользователь получить доступ к запрещенному пути
        if (restrictedForRole.some(restricted => path.startsWith(restricted))) {
            return NextResponse.redirect(new URL('/', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        }
    }
)

export const config = { 
    matcher: [
        '/tasks/:path*',
        '/objects/:path*', 
        '/warehouse/:path*',
        '/fields/:path*',
        '/crop/:path*',
        '/statistics/:path*',
        '/workers/:path*',
        '/admin/:path*',
    ]
}