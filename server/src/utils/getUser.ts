import Deployment from "../models/Deployment";
import Project from "../models/Project";


interface User {
    id: string;
    name: string;
    email: string;
    login: string;
    avatar_url: string;
}


interface CurrentUser {
    id: string;
    email: string;
    username: string;
    role: string;
    is_active: boolean;
    avatar_url: string;
    created_at: string;
    updated_at: string;
}

interface Author {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
}

interface Commit {
    id: string;
    author: Author;
    commit_date: string;
    message: string;
}

interface Environment {
    id: number;
    key: string;
    value: string;
}

interface Project {
    id?: string;
    name: string;
    description: string;
    clone_url: string;
    branch: string;
    port?: number;
    typescript: boolean;
    type: "express" | "nest" | "next" | "react" | "static";
    build_script?: string;
    package_manager: "N/A" | "npm" | "pnpm" | "yarn";
    run_script?: string;
    uptime?: string;
    status: "active" | "failed";
    is_deployed: boolean;
    environments: Environment[];
    commits: Commit[];
    created_at: string;
    updated_at: string;
}

export const getUser = async (token : string) => {

    try {
        if (!token) 
            return


        


        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": "node-fetch"
            }
        });
        const githubUser = await userResponse.json();

        console.log(githubUser)

        const user: User = {
            id: githubUser.id,
            name: githubUser.name,
            email: githubUser.email,
            login: githubUser.login,
            avatar_url: githubUser.avatar
        };

        return user
    } catch (error) {
        return null;
    }
}


export const getUserRepos = async (token : string) => {

    try {
        if (!token) 
            return


        


        const userResponse = await fetch("https://api.github.com/user/repos", {
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": "node-fetch"
            }
        });
        const reposList = await userResponse.json();

        console.log(reposList)

        return reposList
    } catch (error) {
        return null;
    }
}


export const getCommitsList = async (token : string, repo : string, owner : string) => {

    try {
        if (!token) 
            return

        

        let commitsList: Commit[] = [];

        const userResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": "node-fetch"
            }
        });
        const allCommits: any = await userResponse.json();
        allCommits.map((commit : any) => {
            const singleCommit: Commit = {
                id: commit.sha,
                author: commit.commit.author,
                commit_date: commit.commit.author.date,
                message: commit.commit.message
            }
            commitsList.push(singleCommit)
        })

        return commitsList
    } catch (error) {
        console.log((error as Error).message)
        return null;
    }
}

export const getLastCommit = async (token : string, repo : string, owner : string) => {
    try {
        if (!token) 
            return

        

        const userResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": "node-fetch"
            }
        });
        const commitList = await userResponse.json();

        const author = {
            name: commitList[0].commit.author.name,
            email: commitList[0].commit.author.email,
            date: commitList[0].commit.author.date,
            avatar_url: commitList[0].author.avatar_url
        }

        const last_commit = {
            sha: commitList[0].sha,
            author,
            commit_date: commitList[0].commit.author.date,
            message: commitList[0].commit.message
        }

        return last_commit
    } catch (error) {
        return null;
    }
}


// export const createProject = async (projectData : Project) => {
//     try {
//         const project = await Project.create(projectData)
//         return project
//     } catch (error) {
//         console.log((error as Error).message)
//         return null;
//     }
// }


export const getProjectDeployments = async (token : string, project_name : string) => {
    try {
        if (!token) 
            return


        


        const deploymentList = await Deployment.find({project_name})
        console.log(deploymentList)
        return deploymentList

    } catch (error) {
        console.log((error as Error).message)
        return null;
    }
}


type VersionType = 'major' | 'minor' | 'patch';

interface Version {
    major: number;
    minor: number;
    patch: number;
}


function parseVersion(versionString: string): Version {
    const cleanVersion = versionString.startsWith('v') ? versionString.slice(1) : versionString;

    const parts = cleanVersion.split('.');

    if (parts.length !== 3) {
        throw new Error(`Invalid version format: ${versionString}. Expected format: v1.2.3 or 1.2.3`);
    }

    const [major, minor, patch] = parts.map(part => {
        const num = parseInt(part, 10);
        if (isNaN(num)) {
            throw new Error(`Invalid version number in: ${versionString}`);
        }
        return num;
    });

    return {major, minor, patch};
}

function formatVersion(version: Version, includePrefix: boolean = true): string {
    const versionString = `${
        version.major
    }.${
        version.minor
    }.${
        version.patch
    }`;
    return includePrefix ? `v${versionString}` : versionString;
}


export function incrementVersion(oldVersion: string, type: VersionType = 'patch', includePrefix: boolean = true): string {
    const version = parseVersion(oldVersion);

    switch (type) {
        case 'major': version.major += 1;
            version.minor = 0;
            version.patch = 0;
            break;
        case 'minor': version.minor += 1;
            version.patch = 0;
            break;
        case 'patch': version.patch += 1;
            break;
        default:
            throw new Error(`Invalid version type: ${type}. Must be 'major', 'minor', or 'patch'`);
    }

    return formatVersion(version, includePrefix);
}
