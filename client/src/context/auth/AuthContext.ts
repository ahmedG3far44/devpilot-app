import type {AuthContextType}
from "@/types";
import {createContext, useContext} from "react";


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
