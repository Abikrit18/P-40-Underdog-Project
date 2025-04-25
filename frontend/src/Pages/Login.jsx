import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function Login() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const endpoint = isRegistering
            ? 'https://p-40-underdog-project-backend.onrender.com/users/register'
            : 'https://p-40-underdog-project-backend.onrender.com/users/login';

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
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setPassword('');
                    toast.success('Registration successful!', {
                        position: "top-center",
                        autoClose: 3000
                    });
                    setIsRegistering(false);
                    setTimeout(() => navigate('/login'), 1500);
                } else {
                    toast.success('Login successful!', {
                        position: "top-center",
                        autoClose: 2000
                    });
                    const token = data.token;
                    localStorage.setItem('token', token);
                    // Log the decoded token for debugging
                    console.log('Regular login token decoded:', jwtDecode(token));
                    setTimeout(() => navigate('/profile'), 1000);
                }
            } else {
                toast.error(data.error || 'An error occurred', {
                    position: "top-center",
                    autoClose: 4000
                });
            }
        } catch (error) {
            console.error('Error during request:', error);
            toast.error('An unexpected error occurred', {
                position: "top-center",
                autoClose: 4000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        console.log('Google credential decoded:', decoded);

        try {
            const response = await fetch('http://localhost:3000/users/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: decoded.email,
                    firstName: decoded.given_name,
                    lastName: decoded.family_name,
                    googleId: decoded.sub
                }),
            });

            const data = await response.json();
            console.log('Google login response:', data);

            if (response.ok) {
                toast.success('Login successful!', {
                    position: "top-center",
                    autoClose: 2000
                });

                // Store the token and trigger a storage event for other components
                localStorage.setItem('token', data.token);

                // Decode the token to verify it has the correct structure
                try {
                    const tokenDecoded = jwtDecode(data.token);
                    console.log('Server token decoded:', tokenDecoded);
                } catch (tokenError) {
                    console.error('Error decoding server token:', tokenError);
                }

                setTimeout(() => navigate('/profile'), 1000);
            } else {
                toast.error(data.error || 'An error occurred', {
                    position: "top-center",
                    autoClose: 4000
                });
            }
        } catch (error) {
            console.error('Error during Google login:', error);
            toast.error('An unexpected error occurred', {
                position: "top-center",
                autoClose: 4000
            });
        }
    };

    return (
        <GoogleOAuthProvider clientId="973872477079-ee3h58a8lb38h9nfgtdm1kqdnrp9r0e4.apps.googleusercontent.com">
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    {/* Toast notifications container */}
                    <ToastContainer />

                    {/* Decorative elements */}
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-200 rounded-full filter blur-3xl opacity-40"></div>
                    <div className="absolute top-1/2 right-10 w-60 h-60 bg-red-200 rounded-full filter blur-3xl opacity-40"></div>

                    <div className="bg-white shadow-2xl rounded-xl p-8 relative overflow-hidden z-10 border-t-4 border-red-900">
                        {/* Decorative corner accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-700 -rotate-45 transform translate-x-5 -translate-y-5"></div>

                        <div className="text-center">
                            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                                {isRegistering ? 'Create Your Account' : 'Welcome Back!'}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                {isRegistering
                                    ? 'Join our community of dog lovers'
                                    : 'Sign in to continue your journey with UnderDogs'}
                            </p>
                        </div>

                        <div className="mt-4 mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => {
                                        toast.error('Google login failed', {
                                            position: "top-center",
                                            autoClose: 3000
                                        });
                                    }}
                                    useOneTap
                                />
                            </div>
                        </div>

                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {isRegistering && (
                                    <>
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                                First Name
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    type="text"
                                                    id="firstName"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    autoComplete='off'
                                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    required
                                                />
                                                <div className="absolute right-0 inset-y-0 flex items-center pr-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                                Last Name
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    type="text"
                                                    id="lastName"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    autoComplete='off'
                                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    required
                                                />
                                                <div className="absolute right-0 inset-y-0 flex items-center pr-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address
                                    </label>
                                    <div className="mt-1 relative">
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete='off'
                                            className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                            required
                                        />
                                        <div className="absolute right-0 inset-y-0 flex items-center pr-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete='new-password'
                                            className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                            required
                                        />
                                        <div className="absolute right-0 inset-y-0 flex items-center pr-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-red-900 hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transform transition-all duration-150 hover:scale-[1.02] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {/* Decorative icon */}
                                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                        {isLoading ? (
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-red-100 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </span>
                                    {isLoading
                                        ? (isRegistering ? 'Creating Account...' : 'Signing In...')
                                        : (isRegistering ? 'Create Account' : 'Sign In')
                                    }
                                </button>
                            </div>
                        </form>

                        {/* Paw print decorations */}
                        <div className="absolute bottom-3 left-3 opacity-20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512" fill="#8B4513">
                                <path d="M256,224c-79.41,0-192,122.76-192,200.25,0,34.9,26.81,55.75,71.74,55.75,48.84,0,81.09-25.08,120.26-25.08,39.51,0,71.85,25.08,120.26,25.08,44.93,0,71.74-20.85,71.74-55.75C448,346.76,335.41,224,256,224Z" />
                                <path d="M144,128a32,32,0,1,1,32-32A32,32,0,0,1,144,128Z" />
                                <path d="M368,128a32,32,0,1,1,32-32A32,32,0,0,1,368,128Z" />
                                <path d="M240,96a32,32,0,1,1,32-32A32,32,0,0,1,240,96Z" />
                                <path d="M312,64a32,32,0,1,1,32-32A32,32,0,0,1,312,64Z" />
                                <path d="M200,64a32,32,0,1,1,32-32A32,32,0,0,1,200,64Z" />
                            </svg>
                        </div>
                        <div className="absolute bottom-12 right-3 opacity-20 transform rotate-45">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" fill="#8B4513">
                                <path d="M256,224c-79.41,0-192,122.76-192,200.25,0,34.9,26.81,55.75,71.74,55.75,48.84,0,81.09-25.08,120.26-25.08,39.51,0,71.85,25.08,120.26,25.08,44.93,0,71.74-20.85,71.74-55.75C448,346.76,335.41,224,256,224Z" />
                                <path d="M144,128a32,32,0,1,1,32-32A32,32,0,0,1,144,128Z" />
                                <path d="M368,128a32,32,0,1,1,32-32A32,32,0,0,1,368,128Z" />
                                <path d="M240,96a32,32,0,1,1,32-32A32,32,0,0,1,240,96Z" />
                                <path d="M312,64a32,32,0,1,1,32-32A32,32,0,0,1,312,64Z" />
                                <path d="M200,64a32,32,0,1,1,32-32A32,32,0,0,1,200,64Z" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center justify-center mt-6">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-gray-800 hover:text-red-900 font-medium flex items-center transition-colors duration-200"
                        >
                            {isRegistering ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Already have an account? Log in
                                </>
                            ) : (
                                <>
                                    Don't have an account? Sign up
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}
