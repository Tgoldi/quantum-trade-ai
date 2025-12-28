// Login Page Component
import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import backendService from '../api/backendService';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        username: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                // Login
                const result = await login({
                    emailOrUsername: formData.email,
                    password: formData.password
                });

                setSuccess('Login successful!');
                // Auth context will handle the login automatically
            } else {
                // Register
                const result = await register(formData);

                setSuccess('Registration successful! Please login.');
                setTimeout(() => {
                    setIsLogin(true);
                    setFormData({ ...formData, password: '' });
                }, 2000);
            }
        } catch (error) {
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccess('');
        setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            username: ''
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        QuantumTrade AI
                    </h1>
                    <p className="text-slate-400">
                        {isLogin ? 'Welcome back!' : 'Create your account'}
                    </p>
                </div>

                {/* Login/Register Form */}
                <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">
                                {isLogin ? 'Email or Username' : 'Email'}
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder={isLogin ? 'Enter your email or username' : 'Enter your email'}
                                className="bg-slate-800 border-slate-700 text-slate-100"
                                required
                            />
                        </div>

                        {/* Username (Register only) */}
                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-300">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Choose a username"
                                    className="bg-slate-800 border-slate-700 text-slate-100"
                                    required
                                />
                            </div>
                        )}

                        {/* First Name (Register only) */}
                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-slate-300">
                                    First Name
                                </Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder="Enter your first name"
                                    className="bg-slate-800 border-slate-700 text-slate-100"
                                    required
                                />
                            </div>
                        )}

                        {/* Last Name (Register only) */}
                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-slate-300">
                                    Last Name
                                </Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Enter your last name"
                                    className="bg-slate-800 border-slate-700 text-slate-100"
                                    required
                                />
                            </div>
                        )}

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password"
                                    className="bg-slate-800 border-slate-700 text-slate-100 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <Alert className="bg-red-900/20 border-red-800/50">
                                <AlertDescription className="text-red-300">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Success Message */}
                        {success && (
                            <Alert className="bg-green-900/20 border-green-800/50">
                                <AlertDescription className="text-green-300">
                                    {success}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isLogin ? 'Signing in...' : 'Creating account...'}
                                </>
                            ) : (
                                <>
                                    {isLogin ? (
                                        <>
                                            <LogIn className="w-4 h-4 mr-2" />
                                            Sign In
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Create Account
                                        </>
                                    )}
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </p>
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-blue-400 hover:text-blue-300 font-medium mt-1"
                        >
                            {isLogin ? 'Create an account' : 'Sign in instead'}
                        </button>
                    </div>
                </Card>

                {/* Demo Account */}
                <Card className="bg-slate-900/30 border-slate-800/30 p-4 mt-4">
                    <div className="text-center">
                        <p className="text-slate-400 text-sm mb-2">Want to try it out?</p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFormData({
                                    email: 'demo@quantumtrade.ai',
                                    password: 'demo123',
                                    firstName: '',
                                    lastName: '',
                                    username: ''
                                });
                                setIsLogin(true);
                            }}
                            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        >
                            Use Demo Account
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
