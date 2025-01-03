'use server'
 
import { revalidateTag,revalidatePath  } from 'next/cache'
 
export async function revalidateObjects() {
  // Invalidate all data tagged with 'posts' in the cache
  //revalidateTag('objects')
  //revalidateTag(['objects'])
}