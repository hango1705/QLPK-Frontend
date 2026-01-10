import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from '@/components/ui';
import { Upload, X, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { dicomAPI } from '@/services';
import { showNotification } from '@/components/ui';
import { useQueryClient } from '@tanstack/react-query';

interface DicomUploadDialogProps {
  open: boolean;
  patientId: string;
  examinationId?: string;
  treatmentPhaseId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const DicomUploadDialog: React.FC<DicomUploadDialogProps> = ({
  open,
  patientId,
  examinationId,
  treatmentPhaseId,
  onClose,
  onSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'success' | 'error'>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Validate file extensions
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      files.forEach((file) => {
        if (file.name.toLowerCase().endsWith('.dcm')) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      });

      if (invalidFiles.length > 0) {
        showNotification.error(
          'File không hợp lệ', 
          `${invalidFiles.length} file không phải DICOM (.dcm): ${invalidFiles.slice(0, 3).join(', ')}${invalidFiles.length > 3 ? '...' : ''}`
        );
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        // Initialize status for new files
        const newStatus: Record<string, 'idle' | 'success' | 'error'> = {};
        validFiles.forEach((file) => {
          newStatus[file.name] = 'idle';
        });
        setUploadStatus((prev) => ({ ...prev, ...newStatus }));
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      // Validate file extensions
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      files.forEach((file) => {
        if (file.name.toLowerCase().endsWith('.dcm')) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      });

      if (invalidFiles.length > 0) {
        showNotification.error(
          'File không hợp lệ', 
          `${invalidFiles.length} file không phải DICOM (.dcm): ${invalidFiles.slice(0, 3).join(', ')}${invalidFiles.length > 3 ? '...' : ''}`
        );
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        // Initialize status for new files
        const newStatus: Record<string, 'idle' | 'success' | 'error'> = {};
        validFiles.forEach((file) => {
          newStatus[file.name] = 'idle';
        });
        setUploadStatus((prev) => ({ ...prev, ...newStatus }));
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !patientId) return;

    setUploading(true);
    setUploadProgress({});
    setUploadStatus({});

    let successCount = 0;
    let errorCount = 0;
    const totalFiles = selectedFiles.length;

    try {
      // Upload files sequentially
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = file.name;

        // Initialize progress and status for this file
        setUploadProgress((prev) => ({ ...prev, [fileName]: 0 }));
        setUploadStatus((prev) => ({ ...prev, [fileName]: 'idle' }));

        try {
          // Simulate progress for this file
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              const current = prev[fileName] || 0;
              if (current >= 90) {
                clearInterval(progressInterval);
                return { ...prev, [fileName]: 90 };
              }
              return { ...prev, [fileName]: current + 10 };
            });
          }, 200);

          const study = await dicomAPI.uploadDicom(
            file,
            patientId,
            examinationId,
            treatmentPhaseId
          );

          clearInterval(progressInterval);
          setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }));
          setUploadStatus((prev) => ({ ...prev, [fileName]: 'success' }));
          successCount++;
        } catch (error: any) {
          setUploadProgress((prev) => ({ ...prev, [fileName]: 0 }));
          setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));
          errorCount++;
          console.error(`Failed to upload ${fileName}:`, error);
        }
      }

      // Invalidate queries to refresh data
      if (examinationId) {
        queryClient.invalidateQueries({ queryKey: ['dicom-studies', examinationId] });
      }
      if (treatmentPhaseId) {
        queryClient.invalidateQueries({ queryKey: ['dicom-studies-phase', treatmentPhaseId] });
      }
      queryClient.invalidateQueries({ queryKey: ['dicom-studies', patientId] });

      // Show summary notification
      if (successCount > 0 && errorCount === 0) {
        showNotification.success(
          'Upload thành công', 
          `Đã upload thành công ${successCount} file DICOM`
        );
      } else if (successCount > 0 && errorCount > 0) {
        showNotification.warning(
          'Upload một phần', 
          `Đã upload thành công ${successCount}/${totalFiles} file. ${errorCount} file thất bại.`
        );
      } else {
        showNotification.error(
          'Upload thất bại',
          `Không thể upload ${totalFiles} file DICOM. Vui lòng thử lại.`
        );
      }

      // Reset form after short delay if all successful
      if (errorCount === 0) {
        setTimeout(() => {
          setSelectedFiles([]);
          setUploadStatus({});
          setUploadProgress({});
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onSuccess?.();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      showNotification.error(
        'Upload thất bại',
        error?.message || 'Không thể upload DICOM files. Vui lòng thử lại.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setUploadStatus({});
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
    setUploadStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload DICOM File</DialogTitle>
          <DialogDescription>
            Tải lên file DICOM (.dcm) để xem trong hệ thống
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFiles.length > 0
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
            }`}
          >
            {selectedFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <File className="h-12 w-12 text-primary" />
                  <div className="text-left">
                    <div className="font-medium text-sm">
                      Đã chọn {selectedFiles.length} file
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tổng dung lượng: {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
                    </div>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </div>
                        {uploading && uploadProgress[file.name] !== undefined && (
                          <div className="mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-primary h-1 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {uploadStatus[file.name] === 'success' && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Thành công</span>
                          </div>
                        )}
                        {uploadStatus[file.name] === 'error' && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Thất bại</span>
                          </div>
                        )}
                      </div>
                      {!uploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.name)}
                          className="ml-2 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {!uploading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Thêm file
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div className="text-sm text-muted-foreground">
                  Kéo thả file DICOM vào đây hoặc
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Chọn file
                </Button>
                <div className="text-xs text-muted-foreground">
                  Chỉ chấp nhận file .dcm (có thể chọn nhiều file)
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".dcm"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {/* Info Badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            {examinationId && (
              <Badge variant="secondary">Linked to Examination</Badge>
            )}
            {treatmentPhaseId && (
              <Badge variant="secondary">Linked to Treatment Phase</Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading || Object.values(uploadStatus).some(s => s === 'success')}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DicomUploadDialog;


