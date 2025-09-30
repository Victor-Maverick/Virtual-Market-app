'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLogoutHandler } from '@/hooks/useLogoutHandler';
import headerImg from '../../../public/assets/images/headerImg.png';
import profileImage from '../../../public/assets/images/profile-circle.png';

// interface UserProfile {
//     firstName: string;
//     roles: string[];
// }

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const router = useRouter();
    const { data: session, status } = useSession();

    const userProfile = session?.user ? {
        firstName: session.user.firstName,
        roles: session.user.roles || []
    } : null;

    const handleProfileClick = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const navigateToDashboard = () => {
        if (!userProfile?.roles) return;

        const roles = userProfile.roles;
        if (roles.includes('VENDOR') && roles.includes('BUYER')) {
            router.push('/vendor/dashboard');
        }
        else if (roles.includes('ADMIN')) {
        router.push('/admin/dashboard/main');
        }
        else if (roles.includes('LOGISTICS')) {
            router.push('/logistics/dashboard/main');
        } else {
            router.push('/buyer/orders');
        }
        setIsProfileDropdownOpen(false);
    };

    const { handleLogout } = useLogoutHandler();

    return (
        <div className="fixed w-full h-[70px] md:h-[80px] lg:h-[90px] bg-white z-50 flex items-center border-b border-gray-300 shadow-md px-4 sm:px-6 md:px-10 lg:px-20 justify-between max-w-screen">
            <div onClick={() => router.push('/')} className="flex items-center gap-2">
                <Image src={headerImg} alt="FarmGo Logo" width={50} height={50} className="md:w-[50px] md:h-[50px]" />
                <p className="text-[14px] sm:text-[16px] md:text-[18px] font-semibold text-black leading-tight">
                    Farm<span style={{ color: '#c6eb5f' }}>Go</span> <br />
                    <span className="block">Benue</span>
                </p>
            </div>

            <div className="hidden md:flex items-center gap-6 lg:gap-[65px] text-[14px] md:text-[16px] lg:text-[18px] font-normal">
                <p className="cursor-pointer hover:text-[#c6eb5f]" onClick={() => router.push('/')}>
                    Home
                </p>
                <p className="cursor-pointer hover:text-[#c6eb5f]" onClick={() => router.push('/marketPlace')}>
                    Market place
                </p>
                <p className="cursor-pointer hover:text-[#c6eb5f]" onClick={() => router.push('/aboutUs')}>
                    About us
                </p>
            </div>

            {status === 'authenticated' && userProfile ? (
                <div className="hidden md:flex items-center gap-3 relative">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={handleProfileClick}
                    >
                        <Image src={profileImage} alt="Profile" width={28} height={28} className="rounded-full" />
                        <p className="text-sm font-medium text-black">
                            Hey, <span className="font-semibold">{userProfile.firstName}</span>
                        </p>
                    </div>

                    {isProfileDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                            <button
                                onClick={navigateToDashboard}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => router.push('/login')}
                    className="hidden md:block w-[90px] md:w-[100px] lg:w-[110px] h-[35px] md:h-[40px] border border-black rounded-lg cursor-pointer hover:bg-gray-200"
                >
                    Login
                </button>
            )}

            <button
                className="md:hidden text-black flex items-center justify-center p-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>

            {isOpen && (
                <div className="absolute top-[70px] md:top-[80px] lg:top-[90px] left-0 w-full bg-white shadow-md flex flex-col items-center gap-4 py-6 sm:py-8 md:hidden">
                    <p
                        className="cursor-pointer hover:text-[#c6eb5f]"
                        onClick={() => {
                            setIsOpen(false);
                            router.push('/');
                        }}
                    >
                        Home
                    </p>
                    <p
                        className="cursor-pointer hover:text-[#c6eb5f]"
                        onClick={() => {
                            setIsOpen(false);
                            router.push('/marketPlace');
                        }}
                    >
                        MarketPlace
                    </p>
                    <p
                        className="cursor-pointer hover:text-[#c6eb5f]"
                        onClick={() => {
                            setIsOpen(false);
                            router.push('/aboutUs');
                        }}
                    >
                        About us
                    </p>
                    {status === 'authenticated' && userProfile ? (
                        <div className="flex flex-col items-center gap-2 relative">
                            <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            >
                                <Image src={profileImage} alt="Profile" width={28} height={28} className="rounded-full" />
                                <p className="text-sm font-medium text-black">
                                    <span className="font-semibold">{userProfile.firstName}</span>
                                </p>
                            </div>
                            {isProfileDropdownOpen && (
                                <div className="mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                    <button
                                        onClick={() => {
                                            navigateToDashboard();
                                            setIsOpen(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsOpen(false);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/login');
                            }}
                            className="w-[90px] h-[35px] border border-black rounded-lg cursor-pointer hover:bg-gray-200"
                        >
                            Login
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Header;