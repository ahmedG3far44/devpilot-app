# DevPilot :

<p align="center">
  DevPilot is an open-source, self-hosted PaaS (Platform as a Service) that gives developers a Vercel-like deployment experience on their own infrastructure. Connect your GitHub, select a repository, and let devPilot handle the heavy lifting—from cloning and building to SSL termination and DNS records.
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/37c7c2ed-27b8-4040-bf2e-0c7efd4e51bb" width="100%" />

</p>


<p align="center">
  <img src="https://github.com/user-attachments/assets/8c9ec0ce-e561-42b5-8c55-d6346a2c905f" width="100%" />
</p>

## 🚀 Why devPilot?

* **🎯 One-Click Deploy**: Authenticate with GitHub, select a repo, and deploy. No manual SSH or configuration required.
* **🧠 Intelligent Detection**: Automatic detection for **Next.js, React, Express, and NestJS** projects.
* **🔧 Full Infrastructure Control**: Automated **NGINX** reverse proxy, **PM2** process management, and **SSL** via Let's Encrypt.
* **🌐 Dynamic Networking**: Automatic DNS record management through **AWS Route 53** integration.
* **🔌 Flexible Config**: Support for custom root directories (`./server`, `./frontend`), build scripts, and `.env` management.
* **💻 Self-Hosted**: Run your own deployment engine on any VPS, avoiding the "SaaS tax."

## 📦 Tech Stack

* **Frontend**: React, TypeScript, Tailwind CSS
* **Backend**: Node.js, Express, TypeScript, MongoDB
* **Automation**: SSH2, PM2, NGINX, Bash Script
* **Cloud**: AWS Route 53 (Auto-DNS), Let's Encrypt (SSL)
* **Integration**: GitHub OAuth 2.0


## 🚦 Getting Started
### Pre-requisites before installation

* A VPS running Ubuntu 22.04+ (or equivalent)
* AWS Account (for Route 53 DNS automation)
* GitHub Developer Application (for OAuth)
* Node.js v20 or higher

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/ahmedg3far/devpilot.git
cd devpilot

```

#### 2. Install Dependencies

```bash
# Install core dependencies
npm install

# Build the project
npm run build

```

#### 3. Configure Environment

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/devpilot
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret

```

## 📋 Key Features

### Automated Workflow

* **Git Integration**: Watch repositories and trigger deployments on push.
* **Dependency Management**: Automated `npm/yarn/pnpm` install and build processes.
* **Process Persistence**: Uses PM2 to ensure your Node.js apps stay online after crashes or reboots.

### Networking & Security

* **Reverse Proxy**: Automatically generates and reloads NGINX configurations for each project.
* **SSL by Default**: Provisions Let's Encrypt certificates automatically for every linked domain.
* **DNS Automation**: Syncs with AWS Route 53 to point your domains to your VPS IP instantly.

### Deployment Control

* **Environment Isolation**: Securely manage `.env` variables via the devPilot dashboard.
* **Directory Mapping**: Support for monorepos or nested folder structures (e.g., deploying from `./apps/web`).

## 🚀 Usage Guide

### Deploying your first app

1. **Login**: Authenticate using your GitHub account.
2. **Import**: Select the repository you want to deploy.
3. **Configure**:
* Select **Project Type** (e.g., Next.js).
* Set **Root Directory** (e.g., `./`).
* Input your **Domain Name**.


4. **Deploy**: Click "Deploy" and watch the real-time logs as devPilot builds your production environment.

## 🤝 Contributing

We welcome contributions! devPilot is built for developers, by developers.

* Report bugs by opening an [Issue](https://www.google.com/search?q=https://github.com/ahmedg3far/devpilot/issues).
* Submit feature requests.
* Improve the automated deployment scripts.

See our [Contributing Guide](https://www.google.com/search?q=./CONTRIBUTING.md) for local development setup.

## 📄 Legal

* **License**: MIT License
* **Security**: [Security Policy](https://www.google.com/search?q=SECURITY.md)

---

<p align="center">
Built with ❤️ by Ahmed G3far and the open source community
</p>

