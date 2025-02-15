import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isRegistering
            ? 'http://localhost:3000/users/register'
            : 'http://localhost:3000/users/login';
    
        const bodyData = isRegistering
            ? { firstName, lastName, email, password }
            : { email, password };
    
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });
    
            const data = await response.json();
            if (response.ok) {
                if (isRegistering) {
                    // Clear form fields to avoid autofill
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setPassword('');
                    alert('Registration successful!')
                    setIsRegistering(false);
                    // Redirect to login page
                    navigate('/login');
                } else {
                    alert('Login successful!');
                    console.log(data.token);
                    localStorage.setItem('token', data.token);
                    navigate('/profile');
                }
            } else {
                alert(data.error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error during request:', error);
            alert('An unexpected error occurred');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-200">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-md shadow-md">
                <h2 className="text-2xl font-bold text-center">
                    {isRegistering ? 'Register' : 'Log in'}
                </h2>
                <form onSubmit={handleSubmit}>
                    {isRegistering && (
                        <>
                            <div className="mt-4">
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    autoComplete='off'
                                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="mt-4">
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    autoComplete='off'
                                    className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-500"
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div className="mt-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete='off'
                            className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete='new-password'
                            className="mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            {isRegistering ? 'Sign up' : 'Log in'}
                        </button>
                    </div>
                </form>
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-indigo-600 hover:underline"
                    >
                        {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}