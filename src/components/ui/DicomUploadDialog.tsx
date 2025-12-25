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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.dcm')) {
        showNotification.error('File không hợp lệ', 'Vui lòng chọn file DICOM (.dcm)');
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.dcm')) {
        showNotification.error('File không hợp lệ', 'Vui lòng chọn file DICOM (.dcm)');
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientId) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');

    try {
      // Simulate progress (actual upload progress would come from axios)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const study = await dicomAPI.uploadDicom(
        selectedFile,
        patientId,
        examinationId,
        treatmentPhaseId
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');

      // Invalidate queries to refresh data
      if (examinationId) {
        queryClient.invalidateQueries({ queryKey: ['dicom-studies', examinationId] });
      }
      if (treatmentPhaseId) {
        queryClient.invalidateQueries({ queryKey: ['dicom-studies-phase', treatmentPhaseId] });
      }
      queryClient.invalidateQueries({ queryKey: ['dicom-studies', patientId] });

      showNotification.success('Upload thành công', `DICOM study đã được upload: ${study.studyDescription || 'Study'}`);
      
      // Reset form after short delay
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error: any) {
      setUploadStatus('error');
      setUploadProgress(0);
      showNotification.error(
        'Upload thất bại',
        error?.message || 'Không thể upload DICOM file. Vui lòng thử lại.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setUploadStatus('idle');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
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
              selectedFile
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
            }`}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <File className="h-12 w-12 mx-auto text-primary" />
                <div className="font-medium text-sm">{selectedFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={uploading}
                >
                  Chọn file khác
                </Button>
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
                  Chỉ chấp nhận file .dcm
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".dcm"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Đang upload...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">Upload thành công!</span>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-700">Upload thất bại. Vui lòng thử lại.</span>
            </div>
          )}

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
            disabled={!selectedFile || uploading || uploadStatus === 'success'}
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


