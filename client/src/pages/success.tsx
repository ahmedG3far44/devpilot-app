import { LucideCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Success: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/user');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleNavigate = () => {
    navigate('/projects');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center to-muted/20 relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Animated background elements - responsive sizes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow-delayed" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 w-full max-w-2xl">
        {/* Success icon with animation - responsive sizes */}
        <div className="relative">
          {/* Outer ripple rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-2 border-primary/30 animate-ping-slow" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-2 border-primary/20 animate-ping-slower" />
          </div>
          
          {/* Main circle */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 animate-scale-in">
            {/* Checkmark icon */}
            <LucideCheck className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary-foreground animate-check-draw"/>
          </div>
        </div>

        {/* Success message - responsive text sizes */}
        <div className="text-center space-y-2 sm:space-y-3 animate-fade-slide-up px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Deployment Successful!
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            Your project has been deployed successfully and is now live.
          </p>
        </div>

        {/* Status cards - responsive grid and sizing */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-sm sm:max-w-md animate-fade-slide-up-delayed">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center transition-all hover:shadow-lg hover:border-primary/50">
            <div className="text-xl sm:text-2xl font-bold text-foreground">100%</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Build</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center transition-all hover:shadow-lg hover:border-primary/50">
            <div className="text-xl sm:text-2xl font-bold text-foreground">100%</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Tests</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 text-center transition-all hover:shadow-lg hover:border-primary/50">
            <div className="text-xl sm:text-2xl font-bold text-foreground">Live</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Status</div>
          </div>
        </div>

        {/* CTA Button - full width on mobile, auto on desktop */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 animate-fade-slide-up-more-delayed w-full px-4 sm:px-0">
          <button
            onClick={handleNavigate}
            className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-base sm:text-lg shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            <span className="relative z-10">View Projects</span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg
              className="inline-block ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>

          {/* Countdown indicator - responsive text */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 animate-spin-slow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="63"
                strokeDashoffset={countdown * 12.6}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="whitespace-nowrap">Redirecting in {countdown} seconds...</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
        }

        @keyframes ping-slower {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.3;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes pulse-slow-delayed {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes check-draw {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-slide-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slower 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 0.5s;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slow-delayed {
          animation: pulse-slow-delayed 5s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-check-draw {
          animation: check-draw 0.6s ease-out 0.3s backwards;
        }

        .animate-fade-slide-up {
          animation: fade-slide-up 0.6s ease-out 0.4s backwards;
        }

        .animate-fade-slide-up-delayed {
          animation: fade-slide-up 0.6s ease-out 0.6s backwards;
        }

        .animate-fade-slide-up-more-delayed {
          animation: fade-slide-up 0.6s ease-out 0.8s backwards;
        }

        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }

        /* Ensure smooth transitions on all screen sizes */
        @media (max-width: 640px) {
          .animate-scale-in {
            animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        }
      `}</style>
    </div>
  );
};

export default Success;