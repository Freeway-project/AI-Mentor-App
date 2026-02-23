import mongoose, { Schema } from 'mongoose';

export type CampaignRecipientStatus = 'pending' | 'sent' | 'failed';
export type CampaignRunStatus = 'running' | 'complete' | 'failed';

export interface ICampaignRecipient {
    name: string;
    email: string;
    status: CampaignRecipientStatus;
    errorMessage?: string;
}

export interface ICampaignRunDocument extends mongoose.Document {
    templateId: string;
    templateName: string;
    subject: string;
    recipients: ICampaignRecipient[];
    total: number;
    sent: number;
    failed: number;
    status: CampaignRunStatus;
    startedAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const campaignRecipientSchema = new Schema<ICampaignRecipient>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
        errorMessage: { type: String },
    },
    { _id: false }
);

const campaignRunSchema = new Schema<ICampaignRunDocument>(
    {
        templateId: { type: String, required: true },
        templateName: { type: String, required: true },
        subject: { type: String, required: true },
        recipients: { type: [campaignRecipientSchema], required: true },
        total: { type: Number, required: true },
        sent: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        status: { type: String, enum: ['running', 'complete', 'failed'], default: 'running' },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

export const CampaignRunModel = mongoose.model<ICampaignRunDocument>(
    'CampaignRun',
    campaignRunSchema
);

export function toCampaignRun(doc: ICampaignRunDocument) {
    return {
        id: doc._id.toString(),
        templateId: doc.templateId,
        templateName: doc.templateName,
        subject: doc.subject,
        recipients: doc.recipients,
        total: doc.total,
        sent: doc.sent,
        failed: doc.failed,
        status: doc.status,
        startedAt: doc.startedAt,
        completedAt: doc.completedAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
