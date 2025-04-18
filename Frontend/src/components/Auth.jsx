import React from 'react';
import { Zap } from 'lucide-react';

const Index = () => {
  const login = () => {
    window.open('http://localhost:3000/auth/google', '_self');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Enhanced grid background with brighter colors and more movement */}
      <div className="absolute inset-0">
        {/* Horizontal grid lines with enhanced brightness and movement */}
        {Array(15).fill().map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full h-px"
            style={{
              top: `${(i * 100) / 15}%`,
              background: i % 3 === 0 ? 'rgba(0, 195, 255, 0.3)' : 'rgba(0, 145, 255, 0.15)',
              boxShadow: i % 3 === 0 ? '0 0 8px rgba(0, 195, 255, 0.6)' : 'none',
              animation: `moveX ${5 + i % 4}s ease-in-out infinite alternate-reverse`
            }}
          />
        ))}
        
        {/* Vertical grid lines with enhanced brightness and movement */}
        {Array(15).fill().map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full w-px"
            style={{
              left: `${(i * 100) / 15}%`,
              background: i % 3 === 0 ? 'rgba(0, 195, 255, 0.3)' : 'rgba(0, 145, 255, 0.15)',
              boxShadow: i % 3 === 0 ? '0 0 8px rgba(0, 195, 255, 0.6)' : 'none',
              animation: `moveY ${7 + i % 5}s ease-in-out infinite alternate-reverse`
            }}
          />
        ))}
      </div>

      {/* Main content card with futuristic design */}
      <div className="relative bg-gray-900/70 backdrop-blur-md rounded-lg p-8 w-full max-w-md z-10 border border-blue-400/20 shadow-lg">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-blue-500/20 rounded-lg blur-md"></div>
        
        <div className="relative">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-blue-500 rounded-full blur-md opacity-70"></div>
              <Zap className="relative w-12 h-12 text-blue-400" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-center mb-2 font-mono tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">V8</span>
            <span className="text-xs ml-1 align-top text-cyan-400">ENGINE</span>
          </h1>
          
          <p className="text-center text-cyan-300/70 mb-8 text-sm font-mono uppercase tracking-wider">
            Next-Gen Interface System
          </p>
          
          <button
            onClick={login}
            className="group w-full bg-black/50 border border-blue-400/30 hover:border-blue-400/60 text-blue-400 py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center relative overflow-hidden"
          >
            {/* Button glow effect on hover */}
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Animated light line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
            
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            <span className="font-mono tracking-wide">INITIALIZE ACCESS</span>
          </button>
        </div>
      </div>
      
      {/* Animation keyframes with more pronounced movement */}
      <style jsx global>{`
        @keyframes moveX {
          0% { transform: translateX(-8px); }
          100% { transform: translateX(8px); }
        }
        @keyframes moveY {
          0% { transform: translateY(-8px); }
          100% { transform: translateY(8px); }
        }
      `}</style>
    </div>
  );
};

export default Index;