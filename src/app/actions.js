'use server'
 
import { revalidateTag } from 'next/cache'
 
export async function updateObjects() {
  // Invalidate all data tagged with 'posts' in the cache
  revalidateTag('objects')
}