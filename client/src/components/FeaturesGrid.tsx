import React from 'react';
import { Zap, Shield, Globe, Cpu, Infinity, MessageSquareCode } from 'lucide-react';

const features = [
  {
    title: 'Instant Previews',
    desc: 'Get a unique URL for every pull request to review changes before merging.',
    icon: Zap,
    color: 'text-yellow-500'
  },
  {
    title: 'Edge Functions',
    desc: 'Deploy serverless logic globally with low latency at the edge.',
    icon: Cpu,
    color: 'text-purple-500'
  },
  {
    title: 'Automatic HTTPS',
    desc: 'SSL certificates generated and renewed automatically for every domain.',
    icon: Shield,
    color: 'text-green-500'
  },
  {
    title: 'Any Framework',
    desc: 'Seamless support for React, Next.js, Express, NestJS, and more.',
    icon: MessageSquareCode,
    color: 'text-blue-500'
  },
  {
    title: 'Global CDN',
    desc: 'Your content is served from hundreds of locations worldwide instantly.',
    icon: Globe,
    color: 'text-indigo-500'
  },
  {
    title: 'CI/CD Pipeline',
    desc: 'Zero-config integration with GitHub. Push code, we handle the rest.',
    icon: Infinity,
    color: 'text-pink-500'
  }
];

const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">Everything you need to <span className="italic">scale</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">DevPilot provides all the tools developers need to build, deploy, and monitor production-ready applications.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-2">
              <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 border border-border group-hover:bg-primary/5 transition-colors`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
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