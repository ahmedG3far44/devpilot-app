import { useAuth } from '@/context/auth/AuthContext';
import type { DeploymentStep } from '@/types';
import { ArrowRight, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';

import { X } from 'lucide-react';
import { PROCESSING_THRESHOLD } from '@/lib/utils';

import { useDeploymentAnimation } from '../../hooks/useDeploymentAnimation';





const DEMO_VIDEO_URL = "https://cdn.dribbble.com/userupload/46586329/file/bb95c66489817d863688b9b8ca9f12d0.mp4";

export const Hero = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin } = useAuth();
    const { terminalLines } = useDeploymentAnimation();
    const [videoPopupOpen, setVideoPopupOpen] = useState(false);

    const handleGetStarted = useCallback(() => {
        if (isAuthenticated) {
            navigate(isAdmin ? '/dashboard' : '/user');
        } else {
            navigate('/login');
        }
    }, [isAuthenticated, isAdmin, navigate]);

    const openVideoPopup = useCallback(() => setVideoPopupOpen(true), []);
    const closeVideoPopup = useCallback(() => setVideoPopupOpen(false), []);

    return (
        <>
            <div className="relative pt-20 pb-16 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative z-20">

                    {/* Badge */}
                    <div className="z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/40 border border-slate-700/50 mb-8 text-sm font-medium text-slate-300 animate-float">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                        Deploy your GitHub repos in seconds
                    </div>

                    {/* Heading */}
                    <h1 className="z-30 text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight text-white leading-[1.1]">
                        GitHub-Powered <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-500 to-fuchsia-500">
                            Deployments
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="z-30 text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                        The simplest way to deploy your repositories. Connect your GitHub account and go live in minutes. No configuration nightmares.
                    </p>

                    {/* CTA Buttons */}
                    <div className="z-30 flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <button
                            onClick={handleGetStarted}
                            className="cursor-pointer w-full sm:w-auto px-8 py-4 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform shadow-xl shadow-violet-600/25"
                        >
                            Get Started Free <ArrowRight size={20} aria-hidden="true" />
                        </button>

                        <button
                            onClick={openVideoPopup}
                            className="cursor-pointer w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-900 text-white border border-slate-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all"
                        >
                            <Play size={18} fill="currentColor" aria-hidden="true" /> Watch Demo
                        </button>
                    </div>

                    {/* Terminal Animation */}
                    <DeploymentTerminal terminalLines={terminalLines} />
                </div>
            </div>

            {/* Video Popup */}
            <VideoPopup
                isOpen={videoPopupOpen}
                onClose={closeVideoPopup}
                videoUrl={DEMO_VIDEO_URL}
            />
        </>
    );
};

export default Hero;




interface TerminalLineProps {
    line: DeploymentStep;
    index: number;
}

export const TerminalLine = memo<TerminalLineProps>(({ line, index }) => {
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
                    <CheckCircle2
                        size={16}
                        className="text-green-500 animate-scaleIn flex-shrink-0"
                        aria-hidden="true"
                    />
                    <span>{line.text}</span>
                </div>
            );

        case 'deploy':
            return (
                <div key={index} className="pt-2 animate-fadeIn">
                    <span className="text-purple-400">🚀 Deployed to </span>
                    <a
                        href={line.text}
                        className="text-indigo-400 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {line.text}
                    </a>
                </div>
            );

        default:
            return null;
    }
});

TerminalLine.displayName = 'TerminalLine';



interface DeploymentTerminalProps {
    terminalLines: DeploymentStep[];
}

export const DeploymentTerminal = memo<DeploymentTerminalProps>(({ terminalLines }) => {
    const showProcessing = terminalLines.length > 0 && terminalLines.length < PROCESSING_THRESHOLD;

    return (
        <div className="z-50 w-full max-w-4xl mx-auto transition-all duration-300 ease-out">
            <div className="backdrop-blur-sm backdrop-brightness-75 duration-300 transition-all relative bg-violet-900/10 border-2 border-slate-800 rounded-2xl shadow-2xl text-left">

                {/* Terminal Header */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" aria-hidden="true" />
                    <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
                    <div className="ml-4 text-xs font-mono text-slate-500">
                        devpilot --deploy my-awesome-app
                    </div>
                </div>

                {/* Terminal Content */}
                <div className="p-6 font-mono text-sm sm:text-base transition-all duration-500">
                    <div className="space-y-2">
                        {terminalLines.map((line, index) => (
                            <TerminalLine key={index} line={line} index={index} />
                        ))}

                        {showProcessing && (
                            <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                                <span>Processing...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

DeploymentTerminal.displayName = 'DeploymentTerminal';

interface VideoPopupProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title?: string;
}

export const VideoPopup = ({ isOpen, onClose, videoUrl }: VideoPopupProps) => {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';

            return () => {
                document.removeEventListener('keydown', handleEscape);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center bg-black/80 backdrop-blur-sm justify-center p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-title"
        >
            <div
                className="relative w-full max-w-5xl rounded-lg border border-border animate-in zoom-in-95 fade-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 z-50 p-1 rounded-full bg-accent/50 cursor-pointer hover:bg-accent/80 duration-300 text-white hover:text-gray-300 transition-colors"
                    aria-label="Close video"
                >
                    <X size={20} />
                </button>

                <div className="bg-black flex justify-center items-center overflow-hidden shadow-2xl">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <video
                            className="absolute inset-0 w-full h-full"
                            src={videoUrl}
                            controls
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};