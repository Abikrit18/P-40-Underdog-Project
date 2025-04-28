import { Disclosure, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NotificationBell from './NotificationBell';

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Walk', href: '/walk' },
    { name: 'Dogs', href: '/dogs' },
    { name: 'Adoption', href: '/adoption' },
    { name: 'Donation', href: '/donation' },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
    const [activeNav, setActiveNav] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Check authentication status whenever the component mounts or location changes
    useEffect(() => {
        checkAuthStatus();
    }, [location]);

    // Create a separate function to check auth status that can be called from different places
    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setIsLoggedIn(true);
                setUserRole(decoded.role);
            } catch (error) {
                console.error("Invalid Token:", error);
                localStorage.removeItem('token');
                setIsLoggedIn(false);
                setUserRole(null);
                toast.error('Invalid token. Please log in again.', {
                    position: "top-center",
                    autoClose: 3000
                });
            }
        } else {
            setIsLoggedIn(false);
            setUserRole(null);
        }
    };

    // Set up a storage event listener to handle token changes from other tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'token') {
                checkAuthStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Set active nav item based on current location
    useEffect(() => {
        const path = location.pathname;
        const currentNav = navigation.find(item => item.href === path);
        if (currentNav) {
            setActiveNav(currentNav.name);
        } else {
            setActiveNav('');
        }
    }, [location]);

    const handleNavClick = (itemName, href) => {
        const token = localStorage.getItem('token');
        if (itemName === 'Walk' && !token) {
            toast.info('Please log in to access Walk.', {
                position: "top-center",
                autoClose: 3000
            });
            navigate('/login');
        } else {
            setActiveNav(itemName);
            navigate(href);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserRole(null);
        toast.success('Logged out successfully', {
            position: "top-center",
            autoClose: 1000,
            onClose: () => {
                window.location.href = "/login";
            }
        });
    };

    return (
        <>
            <ToastContainer />
            <Disclosure as="nav" style={{ backgroundColor: '#262626' }}>
                {({ open }) => (
                    <>
                        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                            <div className="relative flex h-16 items-center justify-between">
                                <div className="flex flex-1 items-center justify-between sm:items-stretch sm:justify-start">
                                    <div className="flex shrink-0 items-center group">
                                        <a href="/" className="group">
                                        <img
                                                src="/image.png"
                                                className="h-14 w-auto transform transition-transform duration-300 ease-in-out group-hover:translate-y-[-5px]"
                                                alt="Logo"
                                            />
                                        </a>
                                    </div>

                                    <div className="hidden sm:ml-auto sm:flex sm:items-center">
                                        <div className="flex space-x-4">
                                            {navigation.map((item) => (
                                                <button
                                                    key={item.name}
                                                    onClick={() => handleNavClick(item.name, item.href)}
                                                    className={classNames(
                                                        activeNav === item.name
                                                            ? 'text-white font-bold'
                                                            : 'text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px]',
                                                        'rounded-md px-3 py-2 text-sm font-medium text-decoration-none'
                                                    )}
                                                >
                                                    {item.name}
                                                </button>
                                            ))}
                                            {(userRole === 'admin' || userRole === 'Marshall') && (
                                                <button
                                                    onClick={() => handleNavClick('Walk Logs', '/walk-logs')}
                                                    className={classNames(
                                                        activeNav === 'Walk Logs'
                                                            ? 'text-white font-bold'
                                                            : 'text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px]',
                                                        'rounded-md px-3 py-2 text-sm font-medium text-decoration-none'
                                                    )}
                                                >
                                                    WalkLogs
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                                    {isLoggedIn && (
                                        <div className="mr-3">
                                            <NotificationBell />
                                        </div>
                                    )}
                                    <Menu as="div" className="relative">
                                        <div>
                                            <MenuButton className="relative flex items-center justify-center rounded-full text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-900 focus:outline-none w-8 h-8">
                                                <span className="sr-only">Open user menu</span>
                                                <img
                                                    alt="icon"
                                                    src="/icon.png"
                                                    className="h-full w-full rounded-full object-cover"
                                                />
                                            </MenuButton>
                                        </div>
                                        <MenuItems className="absolute right-0 z-10 mt-3 w-48 origin-top-right rounded-md bg-gray-900 py-1 ring-1 shadow-lg ring-black/5 focus:outline-none">
                                            {isLoggedIn ? (
                                                <>
                                                    <MenuItem>
                                                        <a href="/profile" className="block px-4 py-2 text-sm text-white hover:bg-purple-900 rounded-md text-decoration-none">
                                                            Profile
                                                        </a>
                                                    </MenuItem>

                                                    {/* Admin-only Settings 2 */}
                                                    {userRole === 'admin' && (
                                                        <MenuItem>
                                                            <a href="/users" className="block px-4 py-2 text-sm text-white hover:bg-purple-900 rounded-md text-decoration-none">
                                                                Users
                                                            </a>
                                                        </MenuItem>
                                                    )}

                                                    {(userRole === 'admin' || userRole === 'Marshall') && (
                                                        <MenuItem>
                                                            <a href="/doglog" className="block px-4 py-2 text-sm text-white hover:bg-purple-900 rounded-md text-decoration-none">
                                                                DogLogs
                                                            </a>
                                                        </MenuItem>
                                                    )}
                                                    <MenuItem>
                                                        <button
                                                            onClick={handleLogout}
                                                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-red-900 rounded-md"
                                                        >
                                                            Log out
                                                        </button>
                                                    </MenuItem>
                                                </>
                                            ) : (
                                                <MenuItem>
                                                    <a href="/login" className="block px-4 py-2 text-sm text-white hover:bg-purple-900 rounded-md text-decoration-none">
                                                        Log in
                                                    </a>
                                                </MenuItem>
                                            )}
                                        </MenuItems>
                                    </Menu>

                                    <Disclosure.Button className="sm:hidden group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset">
                                        <span className="sr-only">Open main menu</span>
                                        {open ? <XMarkIcon className="block h-6 w-6" aria-hidden="true" /> : <Bars3Icon className="block h-6 w-6" aria-hidden="true" />}
                                    </Disclosure.Button>
                                </div>
                            </div>
                        </div>

                        <Disclosure.Panel className="sm:hidden">
                            <div className="space-y-1 px-2 pt-2 pb-3">
                                {navigation.map((item) => (
                                    <Disclosure.Button
                                        key={item.name}
                                        as="a"
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleNavClick(item.name, item.href);
                                        }}
                                        className={classNames(
                                            activeNav === item.name
                                                ? 'text-white font-bold'
                                                : 'text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:rounded-md text-decoration-none',
                                            'block rounded-md px-3 py-2 text-base font-medium'
                                        )}
                                    >
                                        {item.name}
                                    </Disclosure.Button>
                                ))}
                                {(userRole === 'admin' || userRole === 'Marshall') && (
                                    <Disclosure.Button
                                        as="a"
                                        href="/walk-logs"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleNavClick('Walk Logs', '/walk-logs');
                                        }}
                                        className={classNames(
                                            activeNav === 'Walk Logs'
                                                ? 'text-white font-bold'
                                                : 'text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:rounded-md text-decoration-none',
                                            'block rounded-md px-3 py-2 text-base font-medium'
                                        )}
                                    >
                                        Walk Logs
                                    </Disclosure.Button>
                                )}
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>
        </>
    );
}