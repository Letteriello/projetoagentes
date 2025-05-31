"use client";

import * as React from "react";
import {
  UploadCloud,
  File as FileIcon,
  X as XIcon,
  Image as ImageIcon,
} from "lucide-react";
import { useDropzone, Accept } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Assuming useToast is compatible or we adapt

export interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFileTypes?: Accept; // From react-dropzone, e.g., { 'image/*': ['.jpeg', '.png'] }
  maxFileSize?: number; // In bytes
  maxFiles?: number;
  label?: string;
  labelClassName?: string;
  dropzoneClassName?: string;
  showPreviews?: boolean;
  disabled?: boolean;
  children?: React.ReactNode; // Custom content for dropzone
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  acceptedFileTypes = { "application/octet-stream": [] }, // Default to any file if not specified
  maxFileSize = Infinity,
  maxFiles = 1,
  label = "Arraste e solte arquivos aqui, ou clique para selecionar",
  labelClassName,
  dropzoneClassName,
  showPreviews = false,
  disabled = false,
  children,
}) => {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [fileErrors, setFileErrors] = React.useState<string[]>([]);
  const { toast } = useToast();

  const onDrop = React.useCallback(
    (accepted: File[], rejected: any[]) => {
      setFileErrors([]); // Clear previous errors
      if (rejected && rejected.length > 0) {
        const currentErrors: string[] = [];
        rejected.forEach((rejection: any) => {
          rejection.errors.forEach((error: any) => {
            let message = `Arquivo "${rejection.file.name}": `;
            if (error.code === "file-too-large") {
              message += `Tamanho excede ${maxFileSize / (1024 * 1024)}MB.`;
            } else if (error.code === "file-invalid-type") {
              message += `Tipo de arquivo inválido.`;
            } else if (error.code === "too-many-files") {
              message = `Máximo de ${maxFiles} arquivo(s) permitido(s).`; // General message for this case
            } else {
              message += error.message;
            }
            currentErrors.push(message);
            toast({
              variant: "destructive",
              title: "Erro no Arquivo",
              description: message,
            });
          });
        });
        setFileErrors(currentErrors);
      }

      if (accepted && accepted.length > 0) {
        const newFilesBase = maxFiles === 1 ? [] : selectedFiles;
        const combinedFiles = [...newFilesBase, ...accepted];
        const finalFiles = combinedFiles.slice(0, maxFiles);
        setSelectedFiles(finalFiles);
        onFilesSelected(finalFiles);
      }
    },
    [onFilesSelected, maxFileSize, maxFiles, toast, selectedFiles],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: maxFiles > 1,
    disabled,
  });

  const removeFile = (fileToRemove: File) => {
    const updatedFiles = selectedFiles.filter((file) => file !== fileToRemove);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const baseStyle =
    "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors duration-200 ease-in-out";
  const activeStyle = "border-primary bg-primary/10";
  const acceptStyle = "border-green-500 bg-green-500/10";
  const rejectStyle = "border-destructive bg-destructive/10";

  const dzClassName = cn(
    baseStyle,
    isDragActive && activeStyle,
    isDragAccept && acceptStyle,
    isDragReject && rejectStyle,
    isFocused && "ring-2 ring-ring ring-offset-2",
    disabled && "bg-muted/50 cursor-not-allowed opacity-50",
    dropzoneClassName,
  );

  return (
    <div className="w-full">
      <div {...getRootProps()} className={dzClassName}>
        <input {...getInputProps()} />
        {children ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className={cn("text-sm text-muted-foreground", labelClassName)}>
              {label}
            </p>
            {maxFileSize !== Infinity && (
              <p className="text-xs text-muted-foreground/80">
                Tamanho máximo: {maxFileSize / (1024 * 1024)}MB
              </p>
            )}
            {maxFiles > 1 && (
              <p className="text-xs text-muted-foreground/80">
                Máximo de arquivos: {maxFiles}
              </p>
            )}
          </div>
        )}
      </div>

      {fileErrors.length > 0 && (
        <div className="mt-2 space-y-1">
          {fileErrors.slice(0, 3).map((error, index) => (
            <p key={index} className="text-xs text-destructive">
              {error}
            </p>
          ))}
          {fileErrors.length > 3 && (
            <p className="text-xs text-destructive">
              ...e mais {fileErrors.length - 3} erros.
            </p>
          )}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Arquivos Selecionados:</h4>
          <ul className="divide-y divide-border rounded-md border">
            {selectedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 text-sm"
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  {showPreviews && file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-10 w-10 object-cover rounded"
                      onLoad={() => URL.revokeObjectURL(file.name)} // Clean up object URL
                    />
                  ) : (
                    <FileIcon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(file.size / 1024)} KB - {file.type}
                    </span>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file)}
                    aria-label={`Remover ${file.name}`}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
