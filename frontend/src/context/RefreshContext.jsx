import React, { createContext, useContext, useState } from 'react';

const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => {
        setRefreshKey(prevKey => prevKey + 1);
    };

    return (
        <RefreshContext.Provider value={{ refreshKey, refresh }}>
            {children}
        </RefreshContext.Provider>
    );
};

export const useRefresh = () => useContext(RefreshContext);