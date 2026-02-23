import mongoose, { Schema } from 'mongoose';

/**
 * A lightweight review message exchanged between Admin and a Mentor
 * during the profile approval process. Each mentor has one thread.
 */
export interface IReviewMessageDocument extends mongoose.Document {
    mentorId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderRole: 'admin' | 'mentor';
    content: string;
    readByMentor: boolean;
    readByAdmin: boolean;
    createdAt: Date;
}

const reviewMessageSchema = new Schema<IReviewMessageDocument>(
    {
        mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderRole: { type: String, enum: ['admin', 'mentor'], required: true },
        content: { type: String, required: true, trim: true, maxlength: 2000 },
        readByMentor: { type: Boolean, default: false },
        readByAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);

reviewMessageSchema.index({ mentorId: 1, createdAt: 1 });

export const ReviewMessageModel = mongoose.model<IReviewMessageDocument>('ReviewMessage', reviewMessageSchema);

export function toReviewMessage(doc: IReviewMessageDocument) {
    return {
        id: doc._id.toString(),
        mentorId: doc.mentorId.toString(),
        senderId: doc.senderId.toString(),
        senderRole: doc.senderRole,
        content: doc.content,
        readByMentor: doc.readByMentor,
        readByAdmin: doc.readByAdmin,
        createdAt: doc.createdAt,
    };
}
