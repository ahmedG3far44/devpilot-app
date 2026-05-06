import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeaturesGrid";
import DeploymentDemo from "@/components/DeploymentDemo";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
};

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth overflow-hidden">
      <div className="lg:w-3/4 mx-auto p-4 lg:p-8 relative z-10">
        <Navbar />
      </div>
      
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