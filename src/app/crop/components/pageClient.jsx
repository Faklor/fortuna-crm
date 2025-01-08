'use client'
import { useState, useMemo } from "react"
import '../scss/crop.scss'

export default function PageClient({
    seasons, 
    fields, 
    subFields,
    works,
    applications,
    operations
}){
    const [seasonsState, setSeasonsState] = useState(JSON.parse(seasons))
    const [fieldsState, setFieldsState] = useState(JSON.parse(fields))
    const [subFieldsState, setSubFieldsState] = useState(JSON.parse(subFields))
    const [worksState, setWorksState] = useState(JSON.parse(works))
    const [applicationsState, setApplicationsState] = useState(JSON.parse(applications))
    const [operationsState, setOperationsState] = useState(JSON.parse(operations))

    return
}