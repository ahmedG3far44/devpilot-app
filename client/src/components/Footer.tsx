
import React from 'react';
import { Twitter, Github, Linkedin } from 'lucide-react';
import Logo from './Logo';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="border-t border-slate-800/50 pt-20 pb-10 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="flex items-start justify-start flex-col col-span-1 md:col-span-2">
                        <Logo />

                        <p className="text-slate-400 max-w-sm mb-8">
                            The professional cloud platform for high-performance engineering teams.
                        </p>
                        <div className="flex gap-4">
                            <Link target='_blank' to="https://twitter.com/ahmedg3far44" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                                <Twitter size={20} />
                            </Link>
                            <Link target='_blank' to="https://github.com/ahmedG3far44" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                                <Github size={20} />
                            </Link>
                            <Link target='_blank' to="https://www.linkedin.com/in/ahmedg3far44/" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                                <Linkedin size={20} />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Features</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Integrations</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Privacy Policy</a></li>
                            <li><a href="#" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} DevPilot. All rights reserved. Built by developer <Link className="text-purple-400 hover:underline" target='_blank' to="https://www.linkedin.com/in/ahmedg3far44/">Ahmed G3far</Link> for developers.
                    </p>
                    <div className="flex gap-8">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            System Status: Operational
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
