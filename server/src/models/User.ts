import mongoose, {Schema, Document} from "mongoose";

export interface IUser extends Document {
    githubId: string;
    name: string;
    username: string;
    avatar_url: string;
    repos_url: string;
    location?: string;
    bio?: string;
    isAdmin: boolean;
    blocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}


const UserSchema = new Schema<IUser>({
    githubId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    avatar_url: {
        type: String,
        required: true,
        trim: true
    },
    repos_url: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: true
    },
    blocked: {
        type: Boolean,
        default: false,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: false});


UserSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});


const User = mongoose.model<IUser>('User', UserSchema);
export default User
