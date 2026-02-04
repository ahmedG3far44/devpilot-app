
import {createContext , useContext} from "react"



export interface IEnvironment {
    id: string;
    key: string;
    value: string;
    isVisible?: boolean;
}

export interface DeployBodyType{
    name: string;
    repo:string;
    type: string;
    branch: string;
    typescript: boolean;
    run_script:string;
    build_script?:string;
    main_dir:string;
    environments: IEnvironment[];
    port?:number;
    package_manager?:string;
    command? :string;
}

export interface DeployContextType {
    logs:string[]
    isDeploying:boolean;
    error:string | null;
    handleDeploy:(data:DeployBodyType)=> Promise<void>;
    
}

export const DeployContext = createContext<DeployContextType>({
    logs:[],
    isDeploying:false,
    error: null,
    handleDeploy:()=> Promise.resolve(),
})  


export const useDeploy = () => useContext(DeployContext)