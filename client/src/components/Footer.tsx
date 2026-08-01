import React from "react";
import { Twitter, Github, Linkedin } from "lucide-react";
import Logo from "./Logo";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border pt-20 pb-10 px-6 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
          <div className="flex items-start justify-start flex-col col-span-1 md:col-span-2 gap-2">
            <Logo />

            <p className="text-muted-foreground max-w-sm mb-2">
              The professional cloud platform for high-performance engineering
              teams.
            </p>
            <div className="flex gap-2">
              <Link
                target="_blank"
                to="https://twitter.com/ahmedg3far44"
                className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Twitter size={20} />
              </Link>
              <Link
                target="_blank"
                to="https://github.com/ahmedG3far44"
                className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Github size={20} />
              </Link>
              <Link
                target="_blank"
                to="https://www.linkedin.com/in/ahmedg3far44/"
                className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Linkedin size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-bold mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-bold mb-6">Company</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} DevPilot. All rights reserved.
          </p>
          <div className="flex gap-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Developed By{" "}
              <Link
                className="text-primary hover:underline"
                target="_blank"
                to="https://www.linkedin.com/in/ahmedg3far44/"
              >
                @ahmedG3far44
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
