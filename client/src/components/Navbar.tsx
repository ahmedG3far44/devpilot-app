import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth/AuthContext';

import Logo from './Logo';


const Navbar = () => {
    const { user, isAuthenticated, loading } = useAuth();

    console.log("auth user from navbar", user)
    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur bg-background/80 border-b border-border">
            <div className="container mx-auto">
                <div className="flex h-16 items-center justify-between">
                    <Logo />

                    <>
                        {
                            loading ? (

                                <UserSkeleton themeStatus={false} />

                            ) : (
                                <>
                                    {
                                        isAuthenticated ? (


                                            <div className="flex items-center gap-3 md:gap-6">
                                                <Link
                                                    to="/user"
                                                    className="flex items-center backdrop-blur-sm gap-2 px-3 py-2 rounded-md bg-secondary/80 duration-300 hover:bg-secondary/90 transition-colors group"
                                                >
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden transition-all">
                                                        <img
                                                            className="w-full h-full object-cover"
                                                            src={user?.avatar_url}
                                                            alt={user?.name}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <h4 className="hidden group-hover:text-foreground font-semibold lg:block text-xs text-muted-foreground transition-colors max-w-[120px] truncate">
                                                        @{user?.username}
                                                    </h4>
                                                </Link>
                                            </div>

                                        ) : (

                                            <Link to="/login" className='bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors'>
                                                Login
                                            </Link>

                                        )
                                    }
                                </>
                            )
                        }
                    </>

                </div>
            </div>
        </header>

    );
};

export default Navbar;


export function UserSkeleton({ themeStatus }: { themeStatus: boolean }) {
    return (
        <>
            {
                themeStatus ? (
                    <div className="flex items-center gap-3 md:gap-6 bg-card/80 px-3 py-2 rounded-md">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden transition-all">
                            <div className="w-full h-full bg-accent animate-pulse"></div>
                        </div>
                        <div className="hidden group-hover:text-accent-foreground font-semibold lg:block text-sm text-foreground transition-colors max-w-[120px] truncate">
                            <div className="w-24 h-4 bg-accent animate-pulse"></div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 md:gap-6 bg-secondary/80 px-3 py-2 rounded-md">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden transition-all">
                            <div className="w-full h-full bg-muted animate-pulse"></div>
                        </div>
                        <div className="hidden group-hover:text-foreground font-semibold lg:block text-sm text-muted-foreground transition-colors max-w-[120px] truncate">
                            <div className="w-24 h-4 bg-muted animate-pulse"></div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
