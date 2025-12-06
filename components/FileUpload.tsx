
import React, { useRef, useState } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import Button from './Button';
import Spinner from './Spinner';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  isLoading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  onFileSelect, 
  accept = "image/*,.pdf",
  isLoading = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleClear = () => {
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      {!selectedFileName ? (
        <div 
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Upload className="text-gray-400 mb-2" size={24} />
          <p className="text-sm text-gray-600 font-medium">Click to upload document</p>
          <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, PDF</p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-blue-100 p-2 rounded">
              <FileText className="text-blue-600" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700 truncate max-w-[150px] sm:max-w-xs">
              {selectedFileName}
            </span>
          </div>
          <button 
            onClick={handleClear}
            disabled={isLoading}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            {isLoading ? <Spinner size="sm" /> : <X size={20} />}
          </button>
        </div>
      )}

      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;
