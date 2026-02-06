
import React from 'react';
import { Zap, Shield, Globe, Cpu, Infinity, MessageSquareCode } from 'lucide-react';

const features = [
  {
    title: 'Instant Previews',
    desc: 'Get a unique URL for every pull request to review changes before merging.',
    icon: Zap,
    color: 'text-yellow-400'
  },
  {
    title: 'Edge Functions',
    desc: 'Deploy serverless logic globally with low latency at the edge.',
    icon: Cpu,
    color: 'text-purple-400'
  },
  {
    title: 'Automatic HTTPS',
    desc: 'SSL certificates generated and renewed automatically for every domain.',
    icon: Shield,
    color: 'text-green-400'
  },
  {
    title: 'Any Framework',
    desc: 'Seamless support for React, Next.js, Express, NestJS, and more.',
    icon: MessageSquareCode,
    color: 'text-blue-400'
  },
  {
    title: 'Global CDN',
    desc: 'Your content is served from hundreds of locations worldwide instantly.',
    icon: Globe,
    color: 'text-indigo-400'
  },
  {
    title: 'CI/CD Pipeline',
    desc: 'Zero-config integration with GitHub. Push code, we handle the rest.',
    icon: Infinity,
    color: 'text-pink-400'
  }
];

const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need to <span className="italic">scale</span></h2>
          <p className="text-slate-400 max-w-2xl mx-auto">DevPilot provides all the tools developers need to build, deploy, and monitor production-ready applications.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-6 border border-slate-700 group-hover:bg-purple-500/10 transition-colors`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
