import { motion } from "framer-motion";

import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Header from "../components/Header";
import FeatureGrid from "@/components/FeaturesGrid";
import DeploymentDemo from "@/components/DeploymentDemo";
import Seo from "@/components/Seo";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DevPilot",
  url: "https://devpilot.njerka.xyz/",
  description:
    "DevPilot is a professional cloud platform that helps developers build, deploy, and monitor production-ready applications.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth overflow-x-clip">
      <Seo
        title="DevPilot | Production Operations"
        description="DevPilot is a professional cloud platform that helps developers build, deploy, and monitor production-ready applications. Automatic HTTPS, global CDN, instant previews, and zero-config CI/CD."
        keywords="DevPilot, deployment, cloud platform, CI/CD, DevOps, hosting, React, Next.js, Node.js, monitoring"
        canonicalPath="/"
        jsonLd={jsonLd}
      />

      <Header variant="public" />

      <motion.div {...fadeInUp}>
        <Hero />
      </motion.div>

      <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
        <DeploymentDemo />
      </motion.div>

      <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
        <FeatureGrid />
      </motion.div>

      <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
        <Footer />
      </motion.div>
    </div>
  );
};

export default HomePage;
