import { useState } from 'react';
import { FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import baseUrl from '../api/api';
import { useNavigate } from 'react-router-dom';
import loginBg from '../assets/login-bg.png';
import rootfinLogo from '../assets/rootfin-logo.png';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { customAlert } from '../utils/customAlert.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [EmpId, setEmpId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(baseUrl.baseUrl + 'user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), EmpId: EmpId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("rootfinuser", JSON.stringify(data.user));
        navigate('/');
      } else {
        await customAlert('Login failed: ' + (data.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error during login:', error);
      await customAlert('An error occurred during login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-screen relative overflow-hidden bg-black bg-cover bg-center text-white font-sans select-none p-8 md:p-16 flex items-center justify-between"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {loading && <LoadingScreen title="ROOTFIN" subtitle="BRYNEX FINANCIAL SOFTWARE" />}

      {/* Top Left Logo Image */}
      <div className="absolute top-8 left-8 md:top-22 md:left-16 z-20 flex items-center">
        <img
          src={rootfinLogo}
          alt="RootFin Logo"
          className="h-10 sm:h-8 md:h-6 w-auto object-contain"
        />
      </div>

      {/* Bottom Left Hero Heading - Perfectly Aligned Left with Logo */}
      <div className="absolute bottom-8 left-8 md:bottom-46 md:left-16 max-w-xl text-left z-20">
        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-normal text-white leading-[1.18] tracking-tight">
          Manage your<br />
          finances with clarity<br />
          and confidence.
        </h1>
      </div>

      {/* Right Form Card - Expanded Container Size */}
      <div className="ml-auto my-auto z-20 bg-white rounded-[32px] p-10 sm:p-12 md:p-14 w-full max-w-[490px] shadow-2xl text-gray-900 mr-0 md:mr-6 lg:mr-12">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Welcome Back!
        </h2>
        <p className="text-sm sm:text-base text-gray-400 mb-8">
          Sign in to continue to your RootFin account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
              Email
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-12"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <FiMail className="absolute right-4 text-purple-500 text-xl pointer-events-none" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-12"
                placeholder="Enter your password"
                value={EmpId}
                onChange={(e) => setEmpId(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 text-purple-500 text-xl focus:outline-none hover:text-purple-600 transition-colors cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className={`w-full py-4 rounded-full text-base font-bold text-white transition-all shadow-lg cursor-pointer ${loading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-[#232323] hover:bg-black active:scale-[0.99]"
                }`}
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </button>
          </div>
        </form>

        {/* Footer inside Card */}
        <p className="text-xs text-gray-400 text-center mt-9">
          © 2026 RootFin. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;