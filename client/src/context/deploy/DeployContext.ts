
import type { DeployContextType } from "@/types"
import {createContext , useContext} from "react"



export const DeployContext = createContext<DeployContextType>({
    logs:[],
    isDeploying:false,
    error: null,
    handleDeploy:()=> Promise.resolve(),
})  


export const useDeploy = () => useContext(DeployContext)