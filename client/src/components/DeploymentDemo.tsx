
import React, { useEffect, useState } from 'react';
import { Github, FolderGit2, Settings, BarChart3, ChevronRight, Check, Search, Rocket } from 'lucide-react';
import { Button } from './ui/button';

const steps = [
    { id: 'LOGIN', label: 'Auth', icon: Github, desc: 'Login with GitHub' },
    { id: 'SELECT_REPO', label: 'Repo', icon: FolderGit2, desc: 'Pick your project' },
    { id: 'CONFIGURE', label: 'Config', icon: Settings, desc: 'Fine-tune settings' },
    { id: 'MONITOR', label: 'Live', icon: BarChart3, desc: 'Enjoy your app' },
];

const mockRepos = [
    { name: 'next-saas-starter', lang: 'TypeScript', stars: 1240 },
    { name: 'personal-blog', lang: 'Markdown', stars: 85 },
    { name: 'express-api-template', lang: 'JavaScript', stars: 450 },
];

const DeploymentDemo: React.FC = () => {

    const [activeStep, setActiveStep] = useState(0);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

    const next = () => setActiveStep((p) => Math.min(p + 1, steps.length - 1));
    const prev = () => setActiveStep((p) => Math.max(p - 1, 0));

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => prev < 3 ? prev + 1 : 0)
        }, 3000)
        return () => clearInterval(interval)
    }, [activeStep])
    return (

        <div className='max-w-7xl w-full lg:w-1/2 md:w-3/4 sm:w-full xs:w-full  mx-auto space-y-8'>

            <div>
                <h1 className="text-center my-8 text-3xl md:text-5xl font-bold tracking-tight">Your app deployment steps</h1>
                <p className="text-center text-slate-400 max-w-2xl mx-auto">DevPilot provides all the tools developers need to build, deploy, and monitor production-ready applications in minutes.</p>
            </div>

            <div className="m-4  p-4 lg:m-0 md:m-0 flex flex-col justify-between items-center   bg-slate-900/40 border border-slate-800 rounded-2xl ">

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none"></div>
                <div className="p-8 w-full lg:w-1/2 flex justify-around items-center">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex flex-col items-center relative z-10 group">
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${idx <= activeStep
                                    ? 'bg-violet-600 border-violet-400 shadow-lg shadow-violet-600/30 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-500'
                                    }`}
                            >
                                <step.icon size={22} />
                            </div>
                            <span className={`mt-3 text-xs font-bold uppercase tracking-wider ${idx <= activeStep ? 'text-violet-400' : 'text-slate-600'}`}>
                                {step.label}
                            </span>
                            {idx < steps.length - 1 && (
                                <div className={`absolute left-[calc(100%+0.5rem)] top-6 w-[calc(100%-1rem)] h-0.5 hidden md:block ${idx < activeStep ? 'bg-purple-600' : 'bg-slate-800'}`}></div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mb-20 min-h-[400px] flex items-center justify-center">

                    {activeStep === 0 && (
                        <div className="text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
                                <Github size={40} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Connect your account</h3>
                            <p className="text-slate-400 mb-8 max-w-sm">We'll need permission to read your public repositories to begin deployment.</p>
                            <button
                                onClick={next}
                                className="px-6  cursor-pointer py-2 mx-auto bg-white text-black font-bold rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors"
                            >
                                Authorize with GitHub <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                    {activeStep === 1 && (
                        <div className="w-full max-w-xl animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between mb-6 space-x-4">
                                <h3 className="text-md font-bold">Select Repository</h3>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search repos..."
                                        className="bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {mockRepos.map((repo) => (
                                    <div
                                        key={repo.name}
                                        onClick={() => setSelectedRepo(repo.name)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedRepo === repo.name ? 'border-violet-500 bg-violet-500/5' : 'border-slate-800 bg-slate-800/20 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <FolderGit2 size={24} className={selectedRepo === repo.name ? 'text-violet-400' : 'text-slate-500'} />
                                            <div>
                                                <h4 className="font-semibold text-slate-200">{repo.name}</h4>
                                                <p className="text-xs text-slate-500">Updated 2 days ago • {repo.lang}</p>
                                            </div>
                                        </div>
                                        {selectedRepo === repo.name && <Check size={20} className="text-violet-500" />}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button
                                    disabled={!selectedRepo}
                                    onClick={next}
                                    className="px-6 cursor-pointer py-2 bg-violet-600 disabled:opacity-50 text-white rounded-lg font-bold hover:bg-violet-700 transition-colors"
                                >
                                    Import
                                </button>
                            </div>
                        </div>
                    )}

                    {activeStep === 2 && (
                        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold">Project Configuration</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Build Command</label>
                                        <input type="text" defaultValue="npm run build" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Output Directory</label>
                                        <input type="text" defaultValue=".next" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Package Manager</label>
                                        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500/50">
                                            <option>pnpm</option>
                                            <option>npm</option>
                                            <option>yarn</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold">Environment Variables</h3>
                                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed flex flex-col items-center justify-center h-[180px]">
                                        <Settings className="text-slate-600 mb-2" />
                                        <p className="text-xs text-slate-500 text-center">Paste your .env content or click to add key-value pairs</p>
                                        <button className="mt-4 text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer ">Add Variable</button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 flex justify-between">
                                <button onClick={prev} className="text-slate-400 hover:text-white cursor-pointer font-medium">Back</button>
                                <button onClick={next} className="px-6 py-2 cursor-pointer bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/30">
                                    Deploy Now
                                </button>
                            </div>
                        </div>
                    )}
                    {activeStep === 3 && (
                        <div className="text-center animate-in zoom-in duration-700 space-y-4">
                            <div className="w-18 h-18 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                                <Rocket size={24} className="text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black">Your app is live!</h3>
                            <p className="text-slate-400 text-sm">Congratulations! Your project is now being monitored and served globally.</p>

                            <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
                                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700">
                                    <div className="text-2xl font-bold text-white">99.9%</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Uptime</div>
                                </div>
                                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700">
                                    <div className="text-2xl font-bold text-white">42ms</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Latency</div>
                                </div>
                                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700">
                                    <div className="text-2xl font-bold text-white">0</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Errors</div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <Button className="bg-violet-500 hover:bg-violet-700 text-white ransition-colors px-8 py-3">
                                    Visit Site
                                </Button>
                                <Button onClick={() => setActiveStep(0)} className="px-8 py-3 bg-transparent text-violet-500 border border-violet-500 transition-colors hover:bg-violet-700 hover:text-white hover:border-violet-700">
                                    Dashboard
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DeploymentDemo;
