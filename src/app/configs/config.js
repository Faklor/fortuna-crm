import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'

export const authConfig = {
    providers:[
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }
      
              try {
                const client = await clientPromise;
                const db = client.db("your_database_name");
                
                const user = await db.collection("users").findOne({ 
                  email: credentials.email 
                });
      
                if (!user) {
                  return null;
                }
      
                const isPasswordValid = await compare(credentials.password, user.password);
      
                if (!isPasswordValid) {
                  return null;
                }
      
                return {
                  id: user._id.toString(),
                  email: user.email,
                  name: user.name,
                };
              } catch (error) {
                console.error('Auth error:', error);
                return null;
              }
            }
        }),
    ]
}

// import Email from 'next-auth/providers/email'

// export const authConfig = {
//     providers:[
//         Email({
//             server:process.env.EMAIL_SERVER,
//             from:process.env.EMAIL_FROM,
//         })
//     ]
// }