import "./App.css";
import React, { useState } from "react";
import axios from "axios";

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]); // State to store uploaded file IDs

  const handleFileChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(event.target.files);
    }
  };

  const handleFileChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Convert the existing FileList to an array
      const existingFilesArray = Array.from(selectedFiles || []);
  
      // Convert the new files from the input event to an array
      const newFilesArray = Array.from(event.target.files);
  
      // Concatenate the existing and new arrays
      const combinedFilesArray = existingFilesArray.concat(newFilesArray);
  
      // Create a new DataTransfer object
      const dataTransfer = new DataTransfer();
  
      // Add each file to the DataTransfer object
      combinedFilesArray.forEach(file => {
        dataTransfer.items.add(file);
      });
  
      // Get the FileList from the DataTransfer object
      const combinedFilesList = dataTransfer.files;
  
      // Update the state with the new FileList
      setSelectedFiles(combinedFilesList);
    }
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("files", selectedFiles[i]);
        }
      }

      // Upload files and get the response containing fileIds
      const response = await axios.post(
        "https://pdf-merger-sam-nadar.onrender.com/upload",
        formData
      );

      // Update state with the uploaded fileIds
      setUploadedFiles(
        response.data.files.map((file: { _id: string }) => file._id)
      );

      // Handle success (e.g., display a success message)
      console.log("Files uploaded successfully");
    } catch (error) {
      // Handle error (e.g., display an error message)
      alert("Error uploading files:" + error);
    }
  };

  const handleMerge = async () => {
    try {
      handleAlert();
      // Send a request to the server to perform the merging using actual fileIds
      const response = await axios.post("https://pdf-merger-sam-nadar.onrender.com/merge", {
        fileIds: uploadedFiles,
      });

      // Handle success (e.g., display a success message or download the merged file)
      console.log("PDF files merged successfully");
      console.log("Merged PDF:", response.data.mergedPdf);

      // Example: Download the merged PDF
      const mergedPdfArray = Uint8Array.from(
        atob(response.data.mergedPdf),
        (c) => c.charCodeAt(0)
      );
      const blob = new Blob([mergedPdfArray], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "merged.pdf";
      link.click();
    } catch (error) {
      // Handle error (e.g., display an error message)
      alert("Error uploading files:" + error);
    }
  };

  const handleAlert = () => {
    alert("Your files are merging, please wait");
  };

  return (
    <div>
      <input type="file"   onChange={handleFileChange1} />
      <input type="file"  multiple onChange={handleFileChange2} />
      <button onClick={handleUpload}>Upload</button>
      <button
        style={{
          marginLeft: 10,
        }}
        onClick={handleMerge}
        disabled={uploadedFiles.length === 0}
      >
        Merge
      </button>

    </div>
  );
}

export default App;
