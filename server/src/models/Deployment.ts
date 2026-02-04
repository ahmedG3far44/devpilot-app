import mongoose, {Schema} from "mongoose";

export interface IAuthor {
    name: string;
    email: string;
    date: string;
    avatar_url: string;
}


export interface ICommit extends Document {
    sha: string;
    author: IAuthor;
    commit_date: Date;
    message: string;
}

export interface IDeployment extends Document {
    project_name: string;
    version: string;
    status: 'success' | 'failed';
    last_commit: ICommit;
    created_at?: Date;
    updated_at?: Date;
}


const AuthorSchema = new Schema<IAuthor>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,
        required: true,
        trim: true
    },
    avatar_url: {
        type: String,
        required: true,
        trim: true
    }
}, {timestamps: false});

const CommitSchema = new Schema<ICommit>({
    sha: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: AuthorSchema,
        required: true
    },
    commit_date: {
        type: Date,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    }
}, {timestamps: false});


const DeploymentSchema = new Schema<IDeployment>({
    project_name: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: String,
        required: true,
        trim: true,
        default: '1.0.0'
    },

    status: {
        type: String,
        enum: [
            'success', 'failed'
        ],
        required: true
    },
    last_commit: {
        type: CommitSchema
    }
}, {timestamps: true});


const Deployment = mongoose.model<IDeployment>('Deployment', DeploymentSchema);

DeploymentSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});


export default Deployment
