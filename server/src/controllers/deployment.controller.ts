import {Client} from 'ssh2';
import {Response} from 'express';
import {deploySchema} from '../types/index';
import {AuthRequest, SyncEnvSchema} from '../types';
import {buildDeployCommand} from '../utils/generateCommand';
import {getLastCommit, incrementVersion} from '../utils/getUser';

import dotenv from 'dotenv'
import Project from '../models/Project';
import Deployment from '../models/Deployment';

dotenv.config()


const HOST = process.env.EC2_HOST as string;
const PASSWORD = process.env.EC2_SSH_PASSWORD as string;
const SSH_PORT = process.env.EC2_SSH_PORT as string;
const USERNAME = process.env.EC2_USER as string;
const DOMAIN = process.env.DOMAIN as string;


const SCRIPTS_PATH = '/home/devpilot/scripts';


const buildCleanupCommand = (projectName : string, projectType : string) : string => {
    return `cd ${SCRIPTS_PATH} && sudo ./clean.sh ${projectName} ${projectType}`;
};


const executeSSHCommand = (command : string) : Promise < {
    code: number;
    signal: string;
    output: string;
    error: string
} > => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let output = '';
        let errorOutput = '';

        const cleanup = () => {
            conn.removeAllListeners();
            conn.end();
        };

        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    cleanup();
                    return reject(new Error(`SSH execution error: ${
                        err.message
                    }`));
                }

                stream.on('data', (chunk : Buffer) => {
                    const data = chunk.toString();
                    output += data;
                });

                stream.stderr.on('data', (chunk : Buffer) => {
                    const data = chunk.toString();
                    errorOutput += data;
                });

                stream.on('close', (code : number, signal : string) => {
                    cleanup();
                    resolve({code, signal, output, error: errorOutput});
                });

                stream.on('error', (streamErr : Error) => {
                    cleanup();
                    reject(new Error(`Stream error: ${
                        streamErr.message
                    }`));
                });
            });
        });

        conn.on('error', (connErr : Error) => {
            cleanup();
            reject(new Error(`SSH connection error: ${
                connErr.message
            }`));
        });

        conn.on('timeout', () => {
            cleanup();
            reject(new Error('SSH connection timeout'));
        });

        conn.connect({
            host: HOST,
            username: USERNAME,
            password: PASSWORD,
            port: Number(SSH_PORT),
            tryKeyboard: false,
            readyTimeout: 30000
        });
    });
};

export const deployProject = async (req : AuthRequest, res : Response) => {
    const user = req.user;
    const token = req.cookies.access_token as string;
    const parse = deploySchema.safeParse(req.body);
    if (! parse.success) {
        return res.status(400).json({errors: parse.error.flatten()});
    }
    const data = parse.data;
    if (! data) {
        return res.status(400).json({error: 'Deployment data is required'});
    }
    const command = buildDeployCommand({
        name: data.name,
        clone_url: data.repo,
        type: data.type,
        branch: data.branch,
        package_manager: data.package_manager as "npm" | "pnpm" | "yarn" | "n/a",
        main_dir: data.main_dir,
        run_script: data.run_script,
        typescript: data.typescript,
        port: data.port,
        build_script: data.build_script,
        environments: data ?. environments
    });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders();
    const conn = new Client();
    conn.on("ready", () => {
        res.write("Connected to server...\n");
        conn.exec(`cd /home/devpilot/scripts/ && ${command};`, (err, stream) => {
            if (err) {
                res.write("ERR: " + err.message + "\n");
                res.write("DEPLOY_STATUS:FAILED\n");
                res.end();
                conn.end();
                return;
            }
            stream.on("data", (chunk : Buffer) => {
                res.write(`${
                    chunk.toString()
                }\n`);
            }).stderr.on("data", (chunk : Buffer) => {
                res.write(`ERR: ${
                    chunk.toString()
                }\n`);
            });

            stream.on("close", async (code : number, signal : string) => {
                res.write(`Command finished (exit=${code}, signal=${signal})\n`);

                try {
                    const {
                        name,
                        repo,
                        type,
                        package_manager,
                        main_dir,
                        run_script,
                        typescript,
                        port,
                        build_script
                    } = data;

                    const isServer = ["express", "nest", "next"]

                    const project = {
                        name: name.toLowerCase().trim(),
                        clone_url: repo.toLowerCase().trim(),
                        run_script: run_script ?. toLowerCase().trim(),
                        build_script: build_script ?. toLowerCase().trim(),
                        port,
                        main_dir: main_dir ?. toLowerCase().trim(),
                        type: type.toLowerCase().trim(),
                        typescript,
                        is_deployed: true,
                        environments: data.environments,
                        status: code === 0 ? "active" : "failed",
                        username: user ?. username,
                        production_url: isServer.includes(type) ? `https://api.${
                            data.name.toLowerCase().trim()
                        }.${DOMAIN}` : `https://${
                            data.name.toLowerCase().trim()
                        }.${DOMAIN}`,
                        command,
                        package_manager
                    };

                    let savedProject = await Project.findOne({name: data.name});

                    if (! savedProject) {
                        savedProject = await Project.create(project);

                    } else {
                        savedProject = await Project.findOneAndUpdate({
                            name: data.name
                        }, project, {new: true});

                    }

                    const lastCommit = await getLastCommit(token, data.name, user ?. username as string);


                    const version = incrementVersion(savedProject ?. version || "1.0.0", "patch", true);


                    await Deployment.create({
                        project_name: data.name,
                        version: version,
                        status: code === 0 ? "success" : "failed",
                        last_commit: lastCommit
                    });
                    res.write(`\nDEPLOY_STATUS:SUCCESS\n`);
                    res.write(`PROJECT_ID:${
                        savedProject ?. id
                    }\n`);


                } catch (dbErr) {
                    console.error("DB save error:", dbErr);
                    res.write("\nERR: Failed to save deployment to database\n");
                    res.write("DEPLOY_STATUS:DB_ERROR\n");
                }

                conn.end();
                res.end();
            });
        });

    }).on("error", (err) => {
        res.write("SSH error: " + err.message + "\n");
        res.write("DEPLOY_STATUS:SSH_ERROR\n");
        res.end();
    }).connect({
        host: HOST,
        username: USERNAME,
        password: PASSWORD,
        port: Number(SSH_PORT),
        tryKeyboard: false
    });
};


export const getDeployments = async (req : AuthRequest, res : Response) : Promise < void > => {
    try {
        const userId = req.user ?. id;
        if (! userId) {
            res.status(401).json({error: 'Unauthorized: User not authenticated'});
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const deployments = await Deployment.find({userId}).sort({createdAt: -1}).skip(skip).limit(limit).select('-__v').lean();

        const total = await Deployment.countDocuments({userId});

        res.status(200).json({
            deployments,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch deployments',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getProjectDetails = async (req : AuthRequest, res : Response) : Promise < void > => {
    try {
        const userId = req.user ?. id;

        if (! userId) {
            res.status(401).json({error: 'Unauthorized: User not authenticated'});
            return;
        }

        const {project_id} = req.params;

        const project = await Project.findById({_id: project_id});

        if (! project) {
            res.status(404).json({error: 'Project not found'});
            return;
        }


        const deploymentsList = await Deployment.find({project_name: project.name});

        if (! deploymentsList) {
            res.status(404).json({error: 'Deployment not found'});
            return;
        }

        res.status(200).json({
            data: {
                project: project,
                deployments: deploymentsList
            },
            success: true,
            message: 'Project details fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch deployment',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


export const reDeployProject = async (req : AuthRequest, res : Response) : Promise < void > => {
    try {

        const user = req.user;
        const token = req.cookies.access_token;

        if (! user) {
            res.status(401).json({error: 'Unauthorized: User not authenticated'});
            return;
        }

        const {project_id} = req.params;

        const project = await Project.findOne({_id: project_id});

        if (! project) {
            res.status(404).json({error: 'Project not found'});
            return;
        }

        // write a redeploy project bash script

        // const script = `#!/bin/bash
        // cd ${project.path}
        // git pull
        // npm install
        // npm run build
        // pm2 restart ${project.name}`;

        // fs.writeFileSync(`${project.path}/redeploy.sh`, script);

        // check if the status of redeploy is completed correct

        // create a new deployment
        // const last_commit = await getLastCommit(token, project.name, user.name);

        // if (!last_commit) {
        //     res.status(404).json({error: 'Last commit not found'});
        //     return;
        // }

        const version = incrementVersion(project ?. version || "1.0.0", "patch", true);

        const deployment = await Deployment.create({project_name: project.name, version: version, status: 'success'});


        await Project.updateOne({
            _id: project_id
        }, {version: version});

        res.status(200).json({success: true, message: 'redeployed successfully', deployment});
    } catch (error) {

        res.status(500).json({
            error: 'Failed to update deployment',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const deleteProject = async (req : AuthRequest, res : Response) : Promise < void > => {
    try { // 1. Authentication check
        const userId = req.user ?. id;
        if (! userId) {
            res.status(401).json({success: false, error: 'Unauthorized: User not authenticated'});
            return;
        }

        // 2. Validate project_id
        const {project_id} = req.params;
        if (!project_id) {
            res.status(400).json({success: false, error: 'Project ID is required'});
            return;
        }

        // 3. Find project
        const project = await Project.findById(project_id);
        if (! project) {
            res.status(404).json({success: false, error: 'Project not found'});
            return;
        }

        // 4. Build cleanup command
        const command = buildCleanupCommand(project.name, project.type);

        // 5. Execute SSH cleanup command
        const result = await executeSSHCommand(command);

        // 6. Check if command succeeded
        if (result.code !== 0) {
            console.error(`[Cleanup Failed] Code: ${
                result.code
            }, Signal: ${
                result.signal
            }`);
            res.status(500).json({
                success: false,
                error: 'Failed to delete project',
                details: {
                    exitCode: result.code,
                    signal: result.signal,
                    output: result.error || result.output
                }
            });
            return;
        }

        // 7. Delete deployments
        const deletedDeployments = await Deployment.deleteMany({project_name: project.name});

        // 8. Delete project from database
        await Project.findByIdAndDelete(project_id);

        // 9. Send success response
        res.status(200).json({
                success: true, message: `Project ${
                project.name
            } deleted successfully`,
            data: {
                projectId: project_id,
                projectName: project.name,
                deploymentsDeleted: deletedDeployments.deletedCount
            }
        });

    } catch (error) {
        console.error('[Delete Project Error]:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to delete project',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
};

export const startProject = async (req : AuthRequest, res : Response) : Promise < void > => {
    try {
        const userId = req.user ?. id;

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.flushHeaders();

        if (! userId) {
            res.status(401).json({error: 'Unauthorized: User not authenticated'});
            return;
        }

        const {project_id} = req.params;

        const project = await Project.findById(project_id);

        if (! project) {
            res.status(404).json({error: 'Project not found'});
            return;
        }


        if (project.type === 'static' || project.type === 'react') {
            res.status(400).json({success: false, message: 'Project type not supported'});
            return;
        }


        const startCommand = `cd /var/www/${
            project.name.toLowerCase()
        }
pm2 start ${
            project ?. package_manager ?. toLowerCase() || "npm"
        } --name "api.${
            project.name.toLowerCase()
        }" -- "${
            project.run_script
        }"`


        const conn = new Client()

        conn.on("ready", () => {
            conn.exec(startCommand, (err, stream) => {
                if (err) {
                    console.error("Error executing command:", err);
                    return;
                }
                stream.on("data", (chunk : Buffer) => {
                    console.log(chunk.toString());
                    res.write(chunk.toString());
                }).stderr.on("data", (chunk : Buffer) => {
                    console.error(chunk.toString());
                });
                stream.on("close", async (code : number, signal : string) => {
                    if (code === 0) {
                        project.status = "active"
                        await project.save()
                        res.status(200).json({success: true, message: 'Project started successfully'});
                    } else {
                        res.status(500).json({
                            error: 'Failed to start project',
                            details: 'Command failed with code ' + code + ' and signal ' + signal
                        });
                    }
                });
            });
        }).connect({host: HOST, port: Number(SSH_PORT), username: USERNAME, password: PASSWORD});

        conn.on("error", (err) => {
            console.error("Error executing command:", err);
            res.status(500).json({error: 'Failed to start project', details: err.message});
        });

        conn.end()
    } catch (error) {
        res.status(500).json({
            error: 'Failed to start project',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const stopProject = async (req : AuthRequest, res : Response) : Promise < void > => {
    try {
        const userId = req.user ?. id;

        if (! userId) {
            res.status(401).json({error: 'Unauthorized: User not authenticated'});
            return;
        }

        const {project_id} = req.params;

        const project = await Project.findById(project_id);

        if (! project) {
            res.status(404).json({error: 'Project not found'});
            return;
        }


        if (project.type === 'static' || project.type === 'react') {
            res.status(400).json({success: false, message: 'Project type not supported'});
            return;
        }

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.flushHeaders();


        const stopCommand = `cd /var/www/${
            project.name.toLowerCase()
        } && pm2 stop ${`api.${
                project.name.toLowerCase()
            }`
        }`;

        const conn = new Client()

        conn.on("ready", () => {
            conn.exec(stopCommand, (err, stream) => {
                if (err) {
                    console.error("Error executing command:", err);
                    return;
                }
                stream.on("data", (chunk : Buffer) => {
                    console.log(chunk.toString());
                }).stderr.on("data", (chunk : Buffer) => {
                    console.error(chunk.toString());
                });
                stream.on("close", async (code : number, signal : string) => {
                    if (code === 0) {
                        project.status = "stopped"
                        await project.save()
                        res.status(200).json({success: true, message: 'Project stopped successfully'});
                    } else {
                        res.status(500).json({
                            error: 'Failed to stop project',
                            details: 'Command failed with code ' + code + ' and signal ' + signal
                        });
                    }
                });
            });
        }).connect({host: HOST, port: Number(SSH_PORT), username: USERNAME, password: PASSWORD});

    } catch (error) {
        res.status(500).json({
            error: 'Failed to start project',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


export const syncProjectEnv = async (req : AuthRequest, res : Response) => {
    try {
        const payload = req.body;
        const projectId = req.params.project_id;

        const parsed = SyncEnvSchema.safeParse(payload);

        if (! parsed.success) {
            return res.status(400).json({error: 'Invalid environments data'});
        }

        const environments = parsed.data.environments;

        if (! projectId) {
            return res.status(400).json({error: 'Project ID is required'});
        }

        const project = await Project.findById(projectId);

        if (! project) {
            return res.status(404).json({error: 'Project not found'});
        }

        const envString = environments.map(env => `${
            env.key
        }=${
            env.value
        }`).join("\n");

        const command = `bash ${SCRIPTS_PATH}/sync_env.sh "${
            envString
        }" ${
            project.name.toLowerCase()
        } "${
            project.main_dir ? project.main_dir : "./"
        }"`;

        const conn = new Client();

        conn.on("ready", () => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    console.error("Error executing command:", err);
                    return;
                }
                stream.on("data", (chunk : Buffer) => {
                    console.log(chunk.toString());
                }).stderr.on("data", (chunk : Buffer) => {
                    console.error(chunk.toString());
                });
                stream.on("close", async (code : number, signal : string) => {
                    if (code === 0) {
                        project.environments = environments;
                        await project.save();
                        res.status(200).json({success: true, message: 'Environments synced successfully'});
                    } else {
                        res.status(500).json({
                            error: 'Failed to sync environments',
                            details: 'Command failed with code ' + code + ' and signal ' + signal
                        });
                    }
                });
            });
        }).connect({host: HOST, port: Number(SSH_PORT), username: USERNAME, password: PASSWORD});


    } catch (error) {
        res.status(500).json({
            error: 'Failed to sync environments',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
