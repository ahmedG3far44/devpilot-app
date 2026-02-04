import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth/AuthContext';

import Logo from './Logo';
import LoginButton from './LoginButton';


const Navbar = () => {
    const { user, isAuthenticated, loading } = useAuth();
    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur ">
            <div className="container mx-auto">
                <div className="flex h-16 items-center justify-between">
                    <Logo />

                    {isAuthenticated ? (
                        !loading && (
                            <div className="flex items-center gap-3 md:gap-6">
                                <Link
                                    to="/user"
                                    className="flex items-center backdrop-blur-sm gap-2 px-3 py-2 rounded-md bg-slate-800/80 duration-300 hover:bg-slate-800/90 transition-colors group"
                                >
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden transition-all">
                                        <img
                                            className="w-full h-full object-cover"
                                            src={user?.avatar_url}
                                            alt={user?.name}
                                            loading="lazy"
                                        />
                                    </div>
                                    <h4 className="hidden group-hover:text-white font-semibold lg:block text-sm text-zinc-400 transition-colors max-w-[120px] truncate">
                                        {user?.name}
                                    </h4>
                                </Link>
                            </div>
                        )
                    ) : (
                        <LoginButton>Login with GitHub</LoginButton>
                    )}
                </div>
            </div>
        </header>

    );
};

export default Navbar;
