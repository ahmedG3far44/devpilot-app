import mongoose, {Schema} from "mongoose";


export interface IEnvironment {
    id: string;
    key: string;
    value: string;
}

export type ProjectStatus = 'active' | 'failed' | 'stopped';
export type PackageManager = 'n/a' | 'npm' | 'pnpm' | 'yarn';
export type ProjectTypes = 'express' | 'nest' | 'next' | 'react' | 'static';

export interface IProject extends Document {
    name: string;
    clone_url: string;
    branch: string;
    port?: number;
    typescript?: boolean;
    type: ProjectTypes;
    run_script?: string;
    build_script?: string;
    package_manager?: PackageManager;
    main_dir: string;
    status: ProjectStatus;
    is_deployed: boolean;
    environments: IEnvironment[];
    user: mongoose.Types.ObjectId;
    command: string;
    username: string;
    production_url: string;
    version?: string;
    created_at?: Date;
    updated_at?: Date;
}

const EnvironmentSchema = new Schema<IEnvironment>({
    id: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    }
}, {_id: false});


const ProjectSchema = new Schema<IProject>({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    clone_url: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        required: true,
        trim: true,
        default: 'main'
    },
    port: {
        type: Number,
        min: 4000,
        max: 65535,
        default: 6000
    },
    typescript: {
        type: Boolean,
        default: false,
        required: true
    },
    type: {
        type: String,
        enum: [
            'express',
            'nest',
            'next',
            'react',
            'static'
        ],
        required: true
    },
    build_script: {
        type: String,
        required: true,
        default: 'n/a',
        trim: true
    },
    package_manager: {
        type: String,
        enum: [
            'n/a', 'npm', 'pnpm', 'yarn'
        ],
        default: 'n/a',
        required: true
    },
    run_script: {
        type: String,
        required: true,
        default: 'n/a',
        trim: true
    },
    main_dir: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: [
            'active', 'failed', 'stopped'
        ],
        default: 'stopped',
        required: true
    },
    is_deployed: {
        type: Boolean,
        default: false,
        required: true
    },
    environments: {
        type: [EnvironmentSchema],
        default: []
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    command: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: String,
        required: true,
        default: '1.0.0',
        trim: true
    },
    production_url: {
        type: String,
        required: true,
        trim: true
    }
}, {timestamps: true});


const Project = mongoose.model<IProject>('Project', ProjectSchema);

export default Project
