import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Walk', href: '/walk' },
    { name: 'Dogs', href: '/dogs' },
    { name: 'Adoption', href: '/adoption' },
    { name: 'Donation', href: '/donation' },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
    const [activeNav, setActiveNav] = useState('')

    const handleNavClick = (itemName) => {
        setActiveNav(itemName)
    }

    return (
        <Disclosure as="nav" style={{ backgroundColor: '#800000' }}>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    {/* Logo and navigation items */}
                    <div className="flex flex-1 items-center justify-between sm:items-stretch sm:justify-start">
                        <div className="flex shrink-0 items-center group">
                            <a href="/" className="group">
                                <img
                                    src="/src/assets/image.png"
                                    className="h-14 w-auto transform transition-transform duration-300 ease-in-out group-hover:translate-y-[-5px]"
                                />
                            </a>
                        </div>


                        <div className="hidden sm:ml-auto sm:flex sm:items-center">
                            <div className="flex space-x-4">
                                {navigation.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => handleNavClick(item.name)}
                                        className={classNames(
                                            activeNav === item.name
                                                ? 'bg-gray-900 text-white'
                                                : 'text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px]', // default white text, black on hover
                                            'rounded-md px-3 py-2 text-sm font-medium text-decoration-none'
                                        )}
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>


                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">

                        <Menu as="div" className="relative">
                            <div>
                                <MenuButton className="relative flex items-center justify-center rounded-full bg-red-900 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-900 focus:outline-hidden w-8 h-8">
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">Open user menu</span>
                                    <img
                                        alt=""
                                        src="/src/assets/icon.png"
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                </MenuButton>
                            </div>
                            <MenuItems
                                transition
                                className="absolute right-0 z-10 mt-3 w-48 origin-top-right rounded-md bg-gray-900 py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-hidden"
                            >
                                <MenuItem>
                                    <a
                                        href="#"
                                        className="block px-4 py-2 text-sm text-white hover:bg-purple-900 focus:bg-gray-600 data-focus:outline-hidden text-decoration-none"
                                    >
                                        Your Profile
                                    </a>
                                </MenuItem>
                                <MenuItem>
                                    <a
                                        href="#"
                                        className="block px-4 py-2 text-sm text-white hover:bg-purple-900 focus:bg-gray-600 data-focus:outline-hidden text-decoration-none"
                                    >
                                        Settings
                                    </a>
                                </MenuItem>
                                <MenuItem>
                                    <a
                                        href="/login"
                                        className="block px-4 py-2 text-sm text-white hover:bg-purple-900 focus:bg-gray-600 data-focus:outline-hidden text-decoration-none"
                                    >
                                        Log in
                                    </a>
                                </MenuItem>
                            </MenuItems>
                        </Menu>

                        {/* Mobile menu button (only visible on mobile) */}
                        <DisclosureButton className="sm:hidden group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                            <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                        </DisclosureButton>
                    </div>
                </div>
            </div>

            <DisclosurePanel className="sm:hidden">
                <div className="space-y-1 px-2 pt-2 pb-3">
                    {navigation.map((item) => (
                        <DisclosureButton
                            key={item.name}
                            as="a"
                            href={item.href}
                            onClick={() => handleNavClick(item.name)}
                            className={classNames(
                                activeNav === item.name
                                    ? 'bg-gray-900 text-white'
                                    : 'text-white hover:bg-orange-700 hover:text-black transform transition-transform duration-300 ease-in-out hover:translate-y-[-5px]',
                                'block rounded-md px-3 py-2 text-base font-medium text-decoration-none'
                            )}
                        >
                            {item.name}
                        </DisclosureButton>
                    ))}
                </div>
            </DisclosurePanel>
        </Disclosure>
    )
}
