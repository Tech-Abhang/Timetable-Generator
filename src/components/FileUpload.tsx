
import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

type FileUploadProps = {
  onFileUpload: (file: File) => void;
  fileType: string;
  accept?: string;
};

const FileUpload = ({ onFileUpload, fileType, accept }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    
    try {
      onFileUpload(file);
      setUploadStatus("success");
    } catch (error) {
      console.error("Error handling file:", error);
      setUploadStatus("error");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center ${
        isDragging ? "border-primary bg-secondary/20" : "border-gray-300"
      } ${uploadStatus === "success" ? "border-green-500" : ""} ${
        uploadStatus === "error" ? "border-red-500" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Input
        type="file"
        id={`file-upload-${fileType}`}
        className="hidden"
        onChange={handleFileChange}
        accept={accept}
      />
      
      {uploadStatus === "idle" && !fileName && (
        <div className="py-4">
          <Upload className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop your {fileType} file here, or
          </p>
          <label htmlFor={`file-upload-${fileType}`}>
            <Button variant="outline" className="mt-2" type="button" size="sm">
              Browse Files
            </Button>
          </label>
        </div>
      )}
      
      {fileName && (
        <div className="flex items-center justify-center space-x-2">
          {uploadStatus === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : uploadStatus === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : null}
          <span className="text-sm truncate max-w-[200px]">{fileName}</span>
          <label htmlFor={`file-upload-${fileType}`}>
            <Button variant="outline" size="sm" type="button">
              Change
            </Button>
          </label>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
