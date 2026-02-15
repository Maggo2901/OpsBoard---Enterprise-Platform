import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('opsboard_user');
        const storedToken = localStorage.getItem('opsboard_token');

        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse stored user", error);
                localStorage.removeItem('opsboard_user');
                localStorage.removeItem('opsboard_token');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('opsboard_user', JSON.stringify(userData));
        // If token not provided (e.g. standard user selection), generate a dummy one or use what's given.
        // In a real app this comes from backend. For now, we simulate or use provided.
        const authToken = token || `mock-token-${Date.now()}`;
        localStorage.setItem('opsboard_token', authToken);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('opsboard_user');
        localStorage.removeItem('opsboard_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
