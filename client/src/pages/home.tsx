import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeaturesGrid";
import DeploymentDemo from "@/components/DeploymentDemo";
import Footer from "@/components/Footer";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 scroll-smooth text-white overflow-hidden">
      <div className="w-96 h-96 opacity-20 bg-violet-900 fixed -left-30 bottom-0 rounded-full blur-3xl z-1"></div>
      <div className="w-96 h-96 opacity-20 bg-violet-900 fixed -right-30 top-0 rounded-full blur-3xl z-1"></div>
      <div className="lg:w-3/4 mx-auto p-4 lg:p-8 z-50">
        <Navbar />
      </div>
      <Hero />
      <DeploymentDemo />
      <FeatureGrid />
      <Footer />
    </div>
  );
};

export default HomePage;
