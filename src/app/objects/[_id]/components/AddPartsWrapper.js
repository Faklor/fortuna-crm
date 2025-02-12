"use client"

import { useRouter } from 'next/navigation'
import AddPartsToObject from './AddPartsToObject'

export default function AddPartsWrapper({ objectId, objectName }) {
    const router = useRouter()

    return (
        <AddPartsToObject
            objectId={objectId}
            objectName={objectName}
            onClose={() => router.push(`/objects/${objectId}`)}
            onSuccess={() => {
                router.refresh()
                router.push(`/objects/${objectId}`)
            }}
        />
    )
} 