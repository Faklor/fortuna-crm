import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import Users from "@/models/users";
import {Whirlpool,encoders}  from 'whirlpool-hash'

export async function POST(req){
    await dbConnect()

    try{
        const { password } = await req.json() 

        let whirlpool = new Whirlpool()
        let hash=whirlpool.getHash(password)
        const user = await Users.findOne({login:'admin'})
        console.log(hash)
        if(user.password === encoders.toBase64(hash)){
            localStorage.setItem('admin', hash)
            return NextResponse.json('Успешно')
        }
        else{
            return NextResponse.json('Нет')
        }

        
    }
    catch(e){
        return NextResponse.json('Нет')
    }
}