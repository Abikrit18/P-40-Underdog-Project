import React from 'react';

const PageLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-50 relative">
            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-200 rounded-full filter blur-3xl opacity-40"></div>
            <div className="absolute top-1/2 right-10 w-60 h-60 bg-red-200 rounded-full filter blur-3xl opacity-40"></div>
            
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

            {/* Main content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default PageLayout;