import mongoose, { Schema } from 'mongoose';

export interface IEmailTemplateDocument extends mongoose.Document {
    name: string;
    subject: string;
    bodyHtml: string;
    createdAt: Date;
    updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplateDocument>(
    {
        name: { type: String, required: true },
        subject: { type: String, required: true },
        bodyHtml: { type: String, required: true },
    },
    { timestamps: true }
);

export const EmailTemplateModel = mongoose.model<IEmailTemplateDocument>(
    'EmailTemplate',
    emailTemplateSchema
);

export function toEmailTemplate(doc: IEmailTemplateDocument) {
    return {
        id: doc._id.toString(),
        name: doc.name,
        subject: doc.subject,
        bodyHtml: doc.bodyHtml,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
