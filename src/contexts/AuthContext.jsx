// Authentication Context - Backend Service Version
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import backendService from '../api/backendService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Only check auth if there's a token
                const token = backendService.getAuthToken();
                if (!token) {
                    setLoading(false);
                    return;
                }

                const userData = await backendService.getCurrentUser();
                setUser(userData);
                setIsAuthenticated(true);
            } catch {
                console.log('No valid session found');
                backendService.clearAuthToken();
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (credentials) => {
        const result = await backendService.login(credentials);

        // Set user data
        setUser(result.user);
        setIsAuthenticated(true);

        return result;
    };

    const register = async (userData) => {
        const result = await backendService.register(userData);

        // Set user data
        setUser(result.user);
        setIsAuthenticated(true);

        return result;
    };

    const logout = async () => {
        try {
            await backendService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local state regardless of API call success
            backendService.clearAuthToken();
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
