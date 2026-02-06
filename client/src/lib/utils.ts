import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs : ClassValue[]) {
    return twMerge(clsx(inputs))
}


export const formatDuration = (seconds : number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
}

export const formatTimestamp = (date : Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) 
        return `${minutes}m ago`
    
    if (hours < 24) 
        return `${hours}h ago`
    
    return `${days}d ago`
}
