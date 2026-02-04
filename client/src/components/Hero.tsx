import { useAuth } from '@/context/auth/AuthContext';
import { ArrowRight, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';


interface DeploymentStep {
    type: string;
    text?: string;
    delay: number;
}

const Hero = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin } = useAuth()
    const [terminalLines, setTerminalLines] = useState<DeploymentStep[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const terminalRef = useRef<HTMLDivElement>(null);

    const deploymentSteps = [
        { type: 'command', text: 'vibe deploy my-awesome-app', delay: 0 },
        { type: "success", text: "Checking for vibe app....", delay: 800 },
        { type: 'success', text: 'Cloning repository....', delay: 800 },
        { type: 'success', text: 'Repository cloned successfully', delay: 1200 },
        { type: 'success', text: 'Detecting framework type....', delay: 1200 },
        { type: 'success', text: 'Framework detected successfully', delay: 1200 },
        { type: 'success', text: 'Installing dependencies....', delay: 1200 },
        { type: 'success', text: 'Building the app files....', delay: 1200 },
        { type: 'success', text: 'DNS routing configured successfully', delay: 1600 },
        { type: 'success', text: 'Nginx configured successfully', delay: 1600 },
        { type: 'success', text: 'Generating SSL Certificate....', delay: 1600 },
        { type: 'success', text: 'Your app is almost ready....', delay: 2000 },
        { type: 'success', text: 'Deployment completed successfully....', delay: 2000 },
        { type: 'success', text: 'Your app is ready to use!', delay: 2000 },
        { type: 'deploy', text: 'https://my-awesome-app.vibe.app', delay: 2000 },
        { type: 'reset', delay: 4000 }
    ];

    useEffect(() => {
        window.addEventListener('scroll', () => {
            if (window.scrollY >= 150 && window.scrollY <= 500) {
                setIsVisible(true);
            }
        });
        return () => {
            window.removeEventListener('scroll', () => { });
        };
    }, []);

    useEffect(() => {
        const step = deploymentSteps[currentStep];

        if (!step) return;

        const timer = setTimeout(() => {
            if (step.type === 'reset') {
                setTerminalLines([]);
                setCurrentStep(0);
            } else {
                setTerminalLines((prev) => [...prev, step]);
                setCurrentStep((prev) => prev + 1);
            }
        }, step.delay);

        return () => clearTimeout(timer);
    }, [currentStep]);

    const renderLine = (line: DeploymentStep, index: number) => {
        switch (line.type) {
            case 'command':
                return (
                    <div key={index} className="flex gap-2 animate-fadeIn">
                        <span className="text-purple-400">$</span>
                        <span className="text-green-400">vibe deploy</span>
                        <span className="text-slate-400">my-awesome-app</span>
                    </div>
                );
            case 'success':
                return (
                    <div key={index} className="flex items-center gap-3 text-slate-300 animate-fadeIn">
                        <CheckCircle2 size={16} className="text-green-500 animate-scaleIn" />
                        <span>{line.text}</span>
                    </div>
                );
            case 'deploy':
                return (
                    <div key={index} className="pt-2 animate-fadeIn">
                        <span className="text-purple-400">🚀 Deployed to </span>
                        <a href="#" className="text-indigo-400 hover:underline">{line.text}</a>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleGetStarted = () => {
        if (isAuthenticated) {
            if (isAdmin) {
                return navigate('/dashboard');
            } else {
                return navigate('/user');
            }
        } else {
            return navigate('/login');
        }
    };

    return (
        <div className="relative pt-20 pb-16 px-6 overflow-hidden">

            <div className="max-w-7xl mx-auto text-center relative z-20">

                <div className="z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/40 border border-slate-700/50 mb-8 text-sm font-medium text-slate-300 animate-float">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    Deploy your GitHub repos in seconds
                </div>

                <h1 className="z-30 text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight text-white leading-[1.1]">
                    GitHub-Powered <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-500 to-fuchsia-500">
                        Deployments
                    </span>
                </h1>

                <p className="z-30 text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                    The simplest way to deploy your repositories. Connect your GitHub account and go live in minutes. No configuration nightmares.
                </p>

                <div className="z-30 flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                    <button onClick={handleGetStarted} className="cursor-pointer w-full sm:w-auto px-8 py-4 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform  shadow-xl shadow-violet-600/25">
                        Get Started Free <ArrowRight size={20} />
                    </button>
                    <button onClick={() => { }} className=" cursor-pointer w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-900 text-white border border-slate-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all">
                        <Play size={18} fill="currentColor" /> Watch Demo
                    </button>
                </div>

                {/* Terminal Section with Popup Animation */}
                <div ref={terminalRef} className={` z-50 w-full  max-w-4xl  mx-auto transition-all duration-300 ease-out `}>

                    <div className={`${isVisible ? "h-[600px]" : "h-[250px]"}  backdrop-blur-sm  backdrop-brightness-75  duration-300 ease-out transition-all relative bg-violet-900/10  border-2 border-slate-800 rounded-2xl  shadow-2xl overflow-hidden text-left`}>
                        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div className="ml-4 text-xs font-mono text-slate-500">devpilot --deploy my-awesome-app</div>
                        </div>
                        <div className="p-6 font-mono text-sm sm:text-base min-h-[200px] transition-all duration-500">
                            <div className="space-y-2">
                                {terminalLines.map((line, index) => renderLine(line, index))}
                                {terminalLines.length > 0 && terminalLines.length < 5 && (
                                    <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Processing...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>



            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fill-up {
                    from {
                        height: 240px;
                    }
                    to {
                        height: 600px;
                    }
                }

                @keyframes scaleIn {
                    from {
                        transform: scale(0);
                    }
                    to {
                        transform: scale(1);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                .animate-fill-up {
                    animation: fill-up 0.5s ease-out forwards;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }

                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out forwards;
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Hero;