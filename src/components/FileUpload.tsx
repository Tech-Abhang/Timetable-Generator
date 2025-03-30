
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, XCircle, Check } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  fileType: "courses" | "classrooms";
  accept: string;
}

const FileUpload = ({ onFileUpload, fileType, accept }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      
      setFile(selectedFile);
      onFileUpload(selectedFile);
      toast.success(`${fileType === "courses" ? "Courses" : "Classrooms"} file uploaded successfully`);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = () => {
    setDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (!droppedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      
      setFile(droppedFile);
      onFileUpload(droppedFile);
      toast.success(`${fileType === "courses" ? "Courses" : "Classrooms"} file uploaded successfully`);
    }
  };
  
  const removeFile = () => {
    setFile(null);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {fileType === "courses" ? "Upload Course Data" : "Upload Classroom Data"}
        </CardTitle>
        <CardDescription>
          {fileType === "courses" 
            ? "Upload a CSV file containing course data with columns for Course Name, Faculty, Credits, Semester, etc."
            : "Upload a CSV file containing classroom data with Room Number, Capacity, and Type."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-40 transition-colors ${
            dragging 
              ? "border-accent bg-accent/10" 
              : file 
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-accent"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={removeFile}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Remove File
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm font-medium mb-1">
                Drag and drop your CSV file here
              </p>
              <p className="text-xs text-gray-500 mb-4">
                or click to browse
              </p>
              <input
                type="file"
                id={`file-upload-${fileType}`}
                className="hidden"
                onChange={handleFileChange}
                accept={accept}
              />
              <label htmlFor={`file-upload-${fileType}`}>
                <Button variant="secondary" size="sm" className="cursor-pointer">
                  Browse Files
                </Button>
              </label>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
