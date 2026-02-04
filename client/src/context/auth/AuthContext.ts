import type {IUser, RepositoryCardData}
from "@/types/repository";
import {createContext, useContext} from "react";


export interface AuthContextType {
    user: IUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    repos: RepositoryCardData[]
    logout: () => Promise<void>;
}

export const AuthContext = createContext < AuthContextType > ({
    user: null,
    loading: false,
    isAdmin: false,
    isAuthenticated: false,
    error: null,
    repos: [],
    logout: () => Promise.resolve()
})


export const useAuth = () => useContext(AuthContext);
