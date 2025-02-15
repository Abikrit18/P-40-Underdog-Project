import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Walk', href: '/walk' },
    { name: 'Dogs', href: '/dogs' },
    { name: 'Adoption', href: '/adoption' },
    { name: 'Donation', href: '/donation' },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
    const [activeNav, setActiveNav] = useState('');
    const { isLoggedIn, setIsLoggedIn } = useAuth();
    const navigate = useNavigate();

    const handleNavClick = (itemName) => {
        setActiveNav(itemName);
    }

    const handleSignOut = () => {
        localStorage.removeItem('token'); // Remove token
        setIsLoggedIn(false); // Update login state
        navigate('/login'); // Redirect to login page
    };

    return (
        <Disclosure as="nav" style={{ backgroundColor: '#800000' }}>
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                        <div className="relative flex h-16 items-center justify-between">
                            {/* Logo */}
                            <div className="flex flex-1 items-center justify-between sm:items-stretch sm:justify-start">
                                <div className="flex shrink-0 items-center group">
                                    <a href="/" className="group">
                                        <img
                                            src="/src/assets/image.png"
                                            className="h-14 w-auto transform transition-transform duration-300 ease-in-out group-hover:translate-y-[-5px]"
                                            alt="Logo"
                                        />
                                    </a>
                                </div>

                                {/* Navigation Items */}
                                <div className="hidden sm:ml-auto sm:flex sm:items-center">
                                    <div className="flex space-x-4">
                                        {/* Main Navigation */}
                                        {navigation.map((item) => (
                                            <a
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => handleNavClick(item.name)}
                                                className={classNames(
                                                    activeNav === item.name
                                                        ? 'bg-gray-900 text-white'
                                                        : 'text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px]',
                                                    'rounded-md px-3 py-2 text-sm font-medium text-decoration-none'
                                                )}
                                            >
                                                {item.name}
                                            </a>
                                        ))}

                                        {/* Auth Navigation */}
                                        {isLoggedIn ? (
                                            <>
                                                <a
                                                    href="/profile"
                                                    className="text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px] rounded-md px-3 py-2 text-sm font-medium text-decoration-none"
                                                >
                                                    Dashboard
                                                </a>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px] rounded-md px-3 py-2 text-sm font-medium"
                                                >
                                                    Sign Out
                                                </button>
                                            </>
                                        ) : (
                                            <a
                                                href="/login"
                                                className="text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px] rounded-md px-3 py-2 text-sm font-medium text-decoration-none"
                                            >
                                                Login
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile menu button */}
                            <Disclosure.Button className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                <span className="sr-only">Open main menu</span>
                                {open ? (
                                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </Disclosure.Button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            {[...navigation, 
                              ...(isLoggedIn 
                                  ? [
                                      { name: 'Dashboard', href: '/profile' },
                                      { name: 'Sign Out', href: '#', onClick: handleSignOut }
                                    ]
                                  : [{ name: 'Login', href: '/login' }]
                              )
                            ].map((item) => (
                                <Disclosure.Button
                                    key={item.name}
                                    as="a"
                                    href={item.href}
                                    onClick={item.onClick || (() => handleNavClick(item.name))}
                                    className={classNames(
                                        activeNav === item.name
                                            ? 'bg-gray-900 text-white'
                                            : 'text-white hover:bg-orange-700 hover:text-black',
                                        'block rounded-md px-3 py-2 text-base font-medium'
                                    )}
                                >
                                    {item.name}
                                </Disclosure.Button>
                            ))}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
}
