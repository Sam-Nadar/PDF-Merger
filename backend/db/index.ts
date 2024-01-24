import mongoose, { Document, Schema } from 'mongoose';

interface PdfFile {
  fileName: string;
  fileData: Buffer; // Assuming storing file data as Buffer, adjust based on your needs
  userId?: string; // Optional: If you want to associate files with specific users
  createdAt: Date;
}

interface PdfFileDocument extends PdfFile, Document {}

const pdfFileSchema = new Schema<PdfFileDocument>(
  {
    fileName: {
      type: String,
      required: true,
    },
    fileData: {
      type: Buffer,
      required: true,
    },
    userId: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'pdfFiles' } // Optional: Set a custom collection name
);

const PdfFileModel = mongoose.model<PdfFileDocument>('PdfFile', pdfFileSchema);

export { PdfFileModel, PdfFile, PdfFileDocument };
