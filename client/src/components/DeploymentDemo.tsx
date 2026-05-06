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

        <div className='max-w-7xl w-full lg:w-1/2 md:w-3/4 sm:w-full xs:w-full mx-auto space-y-8'>

            <div>
                <h1 className="text-center my-8 text-3xl md:text-5xl font-bold tracking-tight text-foreground">Your app deployment steps</h1>
                <p className="text-center text-muted-foreground max-w-2xl mx-auto">DevPilot provides all the tools developers need to build, deploy, and monitor production-ready applications in minutes.</p>
            </div>

            <div className="m-4 p-4 lg:m-0 md:m-0 flex flex-col justify-between items-center bg-card border border-border rounded-2xl">

                <div className="p-8 w-full lg:w-1/2 flex justify-around items-center">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex flex-col items-center relative z-10 group">
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${idx <= activeStep
                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                    : 'bg-secondary border-border text-muted-foreground'
                                    }`}
                            >
                                <step.icon size={22} />
                            </div>
                            <span className={`mt-3 text-xs font-bold uppercase tracking-wider ${idx <= activeStep ? 'text-primary' : 'text-muted-foreground'}`}>
                                {step.label}
                            </span>
                            {idx < steps.length - 1 && (
                                <div className={`absolute left-[calc(100%+0.5rem)] top-6 w-[calc(100%-1rem)] h-0.5 hidden md:block ${idx < activeStep ? 'bg-primary' : 'bg-border'}`}></div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mb-20 min-h-[400px] flex items-center justify-center">

                    {activeStep === 0 && (
                        <div className="text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
                                <Github size={40} className="text-foreground" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-foreground">Connect your account</h3>
                            <p className="text-muted-foreground mb-8 max-w-sm">We'll need permission to read your public repositories to begin deployment.</p>
                            <button
                                onClick={next}
                                className="px-6 cursor-pointer py-2 mx-auto bg-primary text-primary-foreground font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-colors"
                            >
                                Authorize with GitHub <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                    {activeStep === 1 && (
                        <div className="w-full max-w-xl animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between mb-6 space-x-4">
                                <h3 className="text-md font-bold text-foreground">Select Repository</h3>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search repos..."
                                        className="bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {mockRepos.map((repo) => (
                                    <div
                                        key={repo.name}
                                        onClick={() => setSelectedRepo(repo.name)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedRepo === repo.name ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <FolderGit2 size={24} className={selectedRepo === repo.name ? 'text-primary' : 'text-muted-foreground'} />
                                            <div>
                                                <h4 className="font-semibold text-foreground">{repo.name}</h4>
                                                <p className="text-xs text-muted-foreground">Updated 2 days ago • {repo.lang}</p>
                                            </div>
                                        </div>
                                        {selectedRepo === repo.name && <Check size={20} className="text-primary" />}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button
                                    disabled={!selectedRepo}
                                    onClick={next}
                                    className="px-6 cursor-pointer py-2 bg-primary disabled:opacity-50 text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-colors"
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
                                    <h3 className="text-xl font-bold text-foreground">Project Configuration</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Build Command</label>
                                        <input type="text" defaultValue="npm run build" className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 text-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Output Directory</label>
                                        <input type="text" defaultValue=".next" className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 text-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Package Manager</label>
                                        <select className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 text-foreground">
                                            <option>pnpm</option>
                                            <option>npm</option>
                                            <option>yarn</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-foreground">Environment Variables</h3>
                                    <div className="p-4 bg-secondary/50 rounded-xl border border-border border-dashed flex flex-col items-center justify-center h-[180px]">
                                        <Settings className="text-muted-foreground mb-2" />
                                        <p className="text-xs text-muted-foreground text-center">Paste your .env content or click to add key-value pairs</p>
                                        <button className="mt-4 text-xs font-bold text-primary hover:opacity-80 cursor-pointer ">Add Variable</button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 flex justify-between">
                                <button onClick={prev} className="text-muted-foreground hover:text-foreground cursor-pointer font-medium">Back</button>
                                <button onClick={next} className="px-6 py-2 cursor-pointer bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all">
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
                            <h3 className="text-2xl font-black text-foreground">Your app is live!</h3>
                            <p className="text-muted-foreground text-sm">Congratulations! Your project is now being monitored and served globally.</p>

                            <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
                                <div className="p-4 bg-secondary/40 rounded-xl border border-border">
                                    <div className="text-2xl font-bold text-foreground">99.9%</div>
                                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Uptime</div>
                                </div>
                                <div className="p-4 bg-secondary/40 rounded-xl border border-border">
                                    <div className="text-2xl font-bold text-foreground">42ms</div>
                                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Latency</div>
                                </div>
                                <div className="p-4 bg-secondary/40 rounded-xl border border-border">
                                    <div className="text-2xl font-bold text-foreground">0</div>
                                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Errors</div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground ransition-colors px-8 py-3">
                                    Visit Site
                                </Button>
                                <Button onClick={() => setActiveStep(0)} className="px-8 py-3 bg-transparent text-primary border border-primary transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary">
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