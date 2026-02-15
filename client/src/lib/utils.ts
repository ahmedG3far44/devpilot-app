import type { DeploymentStep } from "@/types"
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




export const DEPLOYMENT_STEPS: readonly DeploymentStep[] = [
  { type: 'command', text: 'vibe deploy my-awesome-app', delay: 0 },
  { type: 'success', text: 'Checking for vibe app....', delay: 800 },
  { type: 'success', text: 'Cloning repository....', delay: 800 },
  { type: 'success', text: 'Repository cloned successfully', delay: 1200 },
  { type: 'success', text: 'Detecting framework type....', delay: 1200 },
  { type: 'success', text: 'Framework detected successfully', delay: 1200 },
  { type: 'success', text: 'Installing dependencies....', delay: 1200 },
  { type: 'success', text: 'Building the app files....', delay: 1200 },
  { type: 'success', text: 'DNS routing configured successfully', delay: 1600 },
  { type: 'success', text: 'Nginx configured successfully', delay: 1600 },
  { type: 'success', text: 'Generating SSL Certificate....', delay: 1600 },
  { type: 'success', text: 'Your app is almost ready....', delay: 2000 },
  { type: 'success', text: 'Deployment completed successfully....', delay: 2000 },
  { type: 'success', text: 'Your app is ready to use!', delay: 2000 },
  { type: 'deploy', text: 'https://my-awesome-app.vibe.app', delay: 2000 },
  { type: 'reset', delay: 4000 },
] as const;

export const PROCESSING_THRESHOLD = 15;