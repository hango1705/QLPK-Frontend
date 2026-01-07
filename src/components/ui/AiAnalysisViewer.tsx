import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Badge } from '@/components/ui';
import { Loader2, Brain, X, Eye, EyeOff } from 'lucide-react';
import { aiAPI, type AiAnalysisResponse, type AiDetection } from '@/services';
import { showNotification } from '@/components/ui';

interface AiAnalysisViewerProps {
  open: boolean;
  imageUrl: string | null;
  dicomInstanceId?: string;
  imageId?: string;
  onClose: () => void;
  onAnalysisComplete?: (analysis: AiAnalysisResponse) => void;
}

const COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
];

const AiAnalysisViewer: React.FC<AiAnalysisViewerProps> = ({
  open,
  imageUrl,
  dicomInstanceId,
  imageId,
  onClose,
  onAnalysisComplete,
}) => {
  const [analysis, setAnalysis] = useState<AiAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load existing analysis
  useEffect(() => {
    if (open && (dicomInstanceId || imageId)) {
      loadAnalysis();
    }
  }, [open, dicomInstanceId, imageId]);

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (analysis && showBoundingBoxes && imageRef.current && canvasRef.current) {
      drawBoundingBoxes();
    }
  }, [analysis, showBoundingBoxes, imageSize]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      let analyses: AiAnalysisResponse[] = [];
      
      if (dicomInstanceId) {
        analyses = await aiAPI.getAnalysesByDicomInstanceId(dicomInstanceId);
      } else if (imageId) {
        analyses = await aiAPI.getAnalysesByImageId(imageId);
      }

      // Get the most recent completed analysis
      const completedAnalysis = analyses
        .filter(a => a.analysisStatus === 'COMPLETED')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (completedAnalysis) {
        setAnalysis(completedAnalysis);
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl) return;

    try {
      setAnalyzing(true);
      let result: AiAnalysisResponse;

      if (dicomInstanceId) {
        result = await aiAPI.analyzeDicomInstance(dicomInstanceId, confidenceThreshold);
      } else if (imageId) {
        result = await aiAPI.analyzeImageById(imageId, confidenceThreshold);
      } else if (imageUrl) {
        // Analyze from image URL - fetch image and upload
        try {
          showNotification.info('Đang tải ảnh...', 'Vui lòng đợi trong giây lát');
          
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { 
            type: blob.type || 'image/jpeg' 
          });
          
          result = await aiAPI.analyzeImage(file, {
            imageId: imageId,
            confidence: confidenceThreshold,
          });
        } catch (fetchError: any) {
          console.error('Failed to fetch image:', fetchError);
          showNotification.error(
            'Lỗi',
            fetchError?.message || 'Không thể tải ảnh từ URL. Vui lòng thử lại.'
          );
          return;
        }
      } else {
        showNotification.error(
          'Lỗi',
          'Không thể phân tích ảnh. Vui lòng cung cấp image ID hoặc URL.'
        );
        return;
      }

      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      showNotification.success(
        'Thành công',
        `Phân tích hoàn tất. Tìm thấy ${result.totalDetections} đối tượng.`
      );
    } catch (error: any) {
      console.error('Analysis failed:', error);
      showNotification.error(
        'Lỗi',
        error?.response?.data?.message || 'Phân tích thất bại. Vui lòng thử lại.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const drawBoundingBoxes = () => {
    if (!analysis || !imageRef.current || !canvasRef.current || !showBoundingBoxes) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const imgRect = img.getBoundingClientRect();
    
    // Set canvas size to match displayed image size
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;

    // Calculate scale factors
    const scaleX = imgRect.width / (imageSize.width || img.naturalWidth);
    const scaleY = imgRect.height / (imageSize.height || img.naturalHeight);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    analysis.detections.forEach((detection, index) => {
      const color = COLORS[detection.classId % COLORS.length];
      
      // Scale coordinates to match displayed image
      const x = detection.xMin * scaleX;
      const y = detection.yMin * scaleY;
      const width = (detection.xMax - detection.xMin) * scaleX;
      const height = (detection.yMax - detection.yMin) * scaleY;
      
      // Draw rectangle
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      const label = `${detection.className} (${(detection.confidence * 100).toFixed(1)}%)`;
      ctx.font = '12px Arial';
      const labelWidth = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(x, Math.max(0, y - 18), labelWidth + 8, 18);

      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, x + 4, Math.max(12, y - 4));
    });
  };

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth || imageRef.current.clientWidth,
        height: imageRef.current.naturalHeight || imageRef.current.clientHeight,
      });
    }
  };

  // Don't render if dialog is closed or no imageUrl
  if (!open || !imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-4 bg-black/95 border-none !z-[70]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Phân Tích AI
          </DialogTitle>
          <DialogDescription className="sr-only">
            Phân tích ảnh X-Quang bằng AI để phát hiện các vấn đề về răng
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !imageUrl}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Phân tích ảnh
                </>
              )}
            </Button>

            {analysis && (
              <Button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {showBoundingBoxes ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ẩn bounding boxes
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Hiện bounding boxes
                  </>
                )}
              </Button>
            )}

            {analysis && (
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">Tìm thấy:</span>
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  {analysis.totalDetections} đối tượng
                </Badge>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-white text-sm">Ngưỡng tin cậy:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="text-white text-sm w-12">{(confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Image with overlay */}
          <div className="relative flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}

            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Analysis"
                className="max-w-full max-h-[70vh] object-contain block"
                onLoad={handleImageLoad}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          </div>

          {/* Detection list */}
          {analysis && analysis.detections.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 max-h-40 overflow-y-auto">
              <h4 className="text-white font-semibold mb-2">Chi tiết phát hiện:</h4>
              <div className="space-y-1">
                {analysis.detections.map((detection, index) => (
                  <div
                    key={detection.id || index}
                    className="flex items-center justify-between text-sm text-white/80"
                  >
                    <span>
                      {detection.className} (ID: {detection.classId})
                    </span>
                    <span className="text-blue-400">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis && analysis.analysisStatus === 'FAILED' && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">
                Phân tích thất bại: {analysis.errorMessage || 'Không xác định được lỗi'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiAnalysisViewer;

