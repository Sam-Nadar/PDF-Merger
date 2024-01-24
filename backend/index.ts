import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


// Import the PdfFile model and schema
import { PdfFileModel, PdfFile, PdfFileDocument } from './db/index';


const app = express();

// Use the cors middleware with specific origin(s)
// const allowedOrigins = ['https://pdf-merger-git-master-sam-nadars-projects.vercel.app/','https://pdf-merger-sam-nadars-projects.vercel.app/', 'https://pdf-merger-gray.vercel.app/']; // Add the specific URL(s) you want to allow

const allowedOrigins = [
  // 'https://pdf-merger-git-master-sam-nadars-projects.vercel.app/',
  // 'https://pdf-merger-sam-nadars-projects.vercel.app/',
  // 'https://pdf-merger-gray.vercel.app/',
  'https://pdf-merger-git-master-sam-nadars-projects.vercel.app',
  'https://pdf-merger-sam-nadars-projects.vercel.app',
  'https://pdf-merger-gray.vercel.app',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
// const  corsOptions = {origin:process.env.FRONTEND_URL};
app.use(cors(corsOptions));
// app.use(cors());

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

if(process.env.MONGO_URI){
// Set up MongoDB connection (update with your MongoDB URI)
mongoose.connect(process.env.MONGO_URI , { dbName: "pdfmerger" });}

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to merge PDF files using pdf-lib
const mergePdfFiles = async (fileIds: string[]): Promise<Buffer> => {
  try {
    // Fetch PdfFile documents from MongoDB based on fileIds
    const pdfFiles: PdfFileDocument[] = await PdfFileModel.find({ _id: { $in: fileIds } });

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Iterate through each PDF file and append its pages to the merged PDF
    for (const pdfFile of pdfFiles) {
      const pdfBytes = pdfFile.fileData;
      const existingPdf = await PDFDocument.load(pdfBytes as Uint8Array); // Cast to Uint8Array
      const pages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save the merged PDF to a buffer
    const mergedPdfBuffer = Buffer.from(await mergedPdf.save()); // Convert Uint8Array to Buffer

    return mergedPdfBuffer;
  } catch (error) {
    throw new Error('Error merging PDF files');
  }
};


// API endpoint for uploading PDF files
app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    // Handle file uploads and save to MongoDB if needed
    const uploadedFiles: Express.Multer.File[] = req.files as Express.Multer.File[];

    // Save each uploaded file to MongoDB using the PdfFile model
    const savedFiles: PdfFileDocument[] = await Promise.all(
      uploadedFiles.map(async (file) => {
        const newPdfFile: PdfFile = {
          fileName: file.originalname,
          fileData: file.buffer,
          createdAt: new Date(),
        };

        return await PdfFileModel.create(newPdfFile);
      })
    );

    res.status(200).json({ message: 'Files uploaded successfully', files: savedFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// API endpoint for merging PDF files
app.post('/merge', async (req, res) => {
  try {
    const { fileIds } = req.body;

    // Validate that fileIds is an array of valid MongoDB ObjectIds
    if (!Array.isArray(fileIds) || !fileIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid fileIds provided' });
    }

    // Perform the PDF merging
    const mergedPdfBuffer = await mergePdfFiles(fileIds);

    // Respond with the merged PDF file
    res.status(200).json({ message: 'PDF files merged successfully', mergedPdf: mergedPdfBuffer.toString('base64') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
