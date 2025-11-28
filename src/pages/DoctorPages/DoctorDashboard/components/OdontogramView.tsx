import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button } from '@/components/ui';
import { Smile } from 'lucide-react';
import { Odontogram } from 'react-odontogram';

interface ToothData {
  number: number;
  status: string;
  condition?: string;
}

interface OdontogramViewProps {
  teeth: ToothData[];
  onToothClick?: (toothNumber: number) => void;
  onToothStatusChange?: (toothNumber: number, status: string) => void;
}

// Định nghĩa các tình trạng răng và màu sắc tương ứng
const TOOTH_STATUSES = [
  { value: 'normal', label: 'Bình thường', color: '#ffffff', borderColor: '#d1d5db', bgColor: 'bg-white' },
  { value: 'cavity', label: 'Sâu răng', color: '#fef3c7', borderColor: '#f59e0b', bgColor: 'bg-amber-100' },
  { value: 'filled', label: 'Đã trám', color: '#dbeafe', borderColor: '#3b82f6', bgColor: 'bg-blue-100' },
  { value: 'crown', label: 'Bọc răng', color: '#f3e8ff', borderColor: '#a855f7', bgColor: 'bg-purple-100' },
  { value: 'extracted', label: 'Đã nhổ', color: '#e5e7eb', borderColor: '#6b7280', bgColor: 'bg-gray-200' },
  { value: 'root_canal', label: 'Điều trị tủy', color: '#fee2e2', borderColor: '#ef4444', bgColor: 'bg-red-100' },
] as const;

const OdontogramView: React.FC<OdontogramViewProps> = ({ teeth, onToothClick, onToothStatusChange }) => {
  // State quản lý tình trạng của từng răng (toothNumber -> status)
  const [toothStatusMap, setToothStatusMap] = useState<Record<number, string>>(() => {
    const initialMap: Record<number, string> = {};
    teeth.forEach((tooth) => {
      if (tooth.status) {
        initialMap[tooth.number] = tooth.status;
      }
    });
    return initialMap;
  });

  // State quản lý răng đang được chọn để hiển thị dialog
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Convert teeth data to initialSelected format (array of tooth IDs)
  // Format: "teeth-{FDI_number}" (e.g., "teeth-21", "teeth-12")
  const initialSelected = useMemo(() => {
    return Object.keys(toothStatusMap)
      .filter((toothNumber) => {
        const status = toothStatusMap[parseInt(toothNumber, 10)];
        return status && status !== 'normal';
      })
      .map((toothNumber) => `teeth-${toothNumber}`);
  }, [toothStatusMap]);

  // Find tooth group by aria-label (react-odontogram uses aria-label="Tooth teeth-{number}")
  const findToothGroup = (svg: SVGElement, toothNumber: number): Element | null => {
    // Try to find group with aria-label containing the tooth number
    const allGroups = svg.querySelectorAll('g');
    for (const group of allGroups) {
      const ariaLabel = group.getAttribute('aria-label') || '';
      if (ariaLabel.includes(`teeth-${toothNumber}`) || ariaLabel.includes(`Tooth teeth-${toothNumber}`)) {
        return group;
      }
    }
    return null;
  };

  // Handle tooth selection change - mở dialog khi click vào răng
  const handleChange = useCallback((selectedTeeth: Array<{
    id: string;
    notations: {
      fdi: string;
      universal: string;
      palmer: string;
    };
    type: string;
  }>) => {
    // Tìm răng mới được click (răng có trong selectedTeeth nhưng chưa có trong initialSelected)
    const currentSelectedIds = new Set(initialSelected);
    const newlySelected = selectedTeeth.find(
      (tooth) => !currentSelectedIds.has(tooth.id)
    );
    
    // Nếu có răng mới được click, mở dialog
    if (newlySelected) {
      const fdiNumber = parseInt(newlySelected.notations.fdi, 10);
      if (!isNaN(fdiNumber)) {
        setSelectedTooth(fdiNumber);
        setIsDialogOpen(true);
        onToothClick?.(fdiNumber);
      }
    } else if (selectedTeeth.length > 0) {
      // Nếu không có răng mới, nhưng có răng được click (có thể là click lại răng đã chọn)
      // Lấy răng cuối cùng trong danh sách
      const lastTooth = selectedTeeth[selectedTeeth.length - 1];
      const fdiNumber = parseInt(lastTooth.notations.fdi, 10);
      if (!isNaN(fdiNumber)) {
        setSelectedTooth(fdiNumber);
        setIsDialogOpen(true);
        onToothClick?.(fdiNumber);
      }
    }
  }, [initialSelected, onToothClick]);

  // Handle status selection
  const handleStatusSelect = useCallback((status: string) => {
    if (selectedTooth !== null) {
      const toothNumber = selectedTooth; // Save before resetting
      const newStatusMap = { ...toothStatusMap };
      if (status === 'normal') {
        // Nếu chọn "Bình thường", xóa khỏi map
        delete newStatusMap[toothNumber];
      } else {
        newStatusMap[toothNumber] = status;
      }
      setToothStatusMap(newStatusMap);
      onToothStatusChange?.(toothNumber, status);
      setIsDialogOpen(false);
      setSelectedTooth(null);
      
      // Force re-apply colors after a short delay to ensure SVG is updated
      setTimeout(() => {
        const svg = odontogramRef.current?.querySelector('svg.Odontogram') || 
                    odontogramRef.current?.querySelector('svg');
        if (svg) {
          const statusConfig = TOOTH_STATUSES.find((s) => s.value === status);
          const toothGroup = findToothGroup(svg, toothNumber);
          
          if (toothGroup) {
            const paths = toothGroup.querySelectorAll('path');
            
            if (statusConfig && status !== 'normal') {
              paths.forEach((path) => {
                path.style.setProperty('fill', statusConfig.color, 'important');
                path.style.setProperty('stroke', statusConfig.borderColor, 'important');
                path.style.setProperty('stroke-width', '2px', 'important');
              });
            } else if (status === 'normal') {
              // Reset to default
              paths.forEach((path) => {
                path.style.setProperty('fill', 'white', 'important');
                path.style.setProperty('stroke', '#1f2937', 'important');
                path.style.setProperty('stroke-width', '1px', 'important');
              });
            }
          }
        }
      }, 300);
    }
  }, [selectedTooth, toothStatusMap, onToothStatusChange]);

  // Colors configuration - sẽ được override bằng CSS cho từng răng
  const colors = useMemo(() => ({
    selected: '#3b82f6', // blue-500 (default)
    hover: '#60a5fa', // blue-400
  }), []);

  // Ref để track odontogram container
  const odontogramRef = useRef<HTMLDivElement>(null);

  // Generate CSS để highlight từng răng với màu tương ứng
  const toothColorStyles = useMemo(() => {
    return Object.entries(toothStatusMap)
      .map(([toothNumber, status]) => {
        const statusConfig = TOOTH_STATUSES.find((s) => s.value === status);
        if (!statusConfig || status === 'normal') return '';
        return `
          /* Target tooth by ID - multiple selectors to catch all cases */
          .react-odontogram svg #teeth-${toothNumber} path,
          .react-odontogram svg #teeth-${toothNumber} > path,
          .react-odontogram svg g[id="teeth-${toothNumber}"] path,
          .react-odontogram svg g[id="teeth-${toothNumber}"] > path,
          .react-odontogram svg [id="teeth-${toothNumber}"] path,
          .react-odontogram svg [id="teeth-${toothNumber}"] > path {
            fill: ${statusConfig.color} !important;
            stroke: ${statusConfig.borderColor} !important;
            stroke-width: 2px !important;
          }
          /* Also target any nested paths */
          .react-odontogram svg #teeth-${toothNumber} path[fill],
          .react-odontogram svg g[id="teeth-${toothNumber}"] path[fill],
          .react-odontogram svg [id="teeth-${toothNumber}"] path[fill] {
            fill: ${statusConfig.color} !important;
          }
        `;
      })
      .join('\n');
  }, [toothStatusMap]);

  // Apply colors directly to SVG elements using useEffect
  useEffect(() => {
    if (!odontogramRef.current) return;

    const applyColors = () => {
      const svg = odontogramRef.current?.querySelector('svg.Odontogram') || 
                  odontogramRef.current?.querySelector('svg');
      if (!svg) return false;

      // Apply colors to each tooth based on status
      Object.entries(toothStatusMap).forEach(([toothNumberStr, status]) => {
        const toothNumber = parseInt(toothNumberStr, 10);
        const statusConfig = TOOTH_STATUSES.find((s) => s.value === status);
        
        // Find the correct group by aria-label
        const toothGroup = findToothGroup(svg, toothNumber);
        
        if (!toothGroup) {
          console.warn(`Could not find group for tooth ${toothNumber}`);
          return;
        }

        const paths = toothGroup.querySelectorAll('path');
        
        if (paths.length === 0) return;

        if (!statusConfig || status === 'normal') {
          // Reset to default for normal teeth
          paths.forEach((path) => {
            path.style.setProperty('fill', 'white', 'important');
            path.style.setProperty('stroke', '#1f2937', 'important');
            path.style.setProperty('stroke-width', '1px', 'important');
          });
        } else {
          // Apply color based on status
          paths.forEach((path) => {
            path.style.setProperty('fill', statusConfig.color, 'important');
            path.style.setProperty('stroke', statusConfig.borderColor, 'important');
            path.style.setProperty('stroke-width', '2px', 'important');
          });
        }
      });
      
      return true;
    };

    // Try immediately
    if (!applyColors()) {
      // If SVG not ready, wait and retry
      const timeoutId = setTimeout(() => {
        applyColors();
      }, 200);

      // Also try after a longer delay
      const timeoutId2 = setTimeout(() => {
        applyColors();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
      };
    }
  }, [toothStatusMap, initialSelected]);

  return (
    <Card className="border-none bg-white/90 shadow-medium rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Smile className="h-5 w-5 text-primary" />
          Odontogram
        </CardTitle>
        <CardDescription>Sơ đồ răng và tình trạng điều trị</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Odontogram Component */}
          <div 
            ref={odontogramRef}
            className="w-full overflow-x-auto bg-white rounded-xl p-4 [&_svg]:bg-white [&_svg_path]:stroke-gray-800 [&_svg_path]:fill-white"
          >
            <style>{`
              /* Override odontogram styles for light theme */
              .react-odontogram svg {
                background-color: white !important;
              }
              .react-odontogram svg path {
                stroke: #1f2937 !important;
                fill: white !important;
              }
              
              /* Show tooth numbers/labels - target all text and tspan elements */
              .react-odontogram svg text,
              .react-odontogram svg tspan {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                fill: #1f2937 !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                pointer-events: none !important;
              }
              
              /* Ensure all text elements are visible - override any hidden styles */
              .react-odontogram svg text[style*="display: none"],
              .react-odontogram svg text[style*="visibility: hidden"],
              .react-odontogram svg text[style*="opacity: 0"],
              .react-odontogram svg tspan[style*="display: none"],
              .react-odontogram svg tspan[style*="visibility: hidden"],
              .react-odontogram svg tspan[style*="opacity: 0"] {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              
              /* Show any hidden text elements */
              .react-odontogram svg * {
                visibility: visible !important;
              }
              
              /* Custom colors for each tooth based on status */
              ${toothColorStyles}
              
              /* Style for selected/hovered teeth */
              .react-odontogram svg path[fill*="#3b82f6"]:not([data-tooth-status]) {
                fill: #3b82f6 !important;
                stroke: #2563eb !important;
              }
            `}</style>
            <Odontogram
              onChange={handleChange}
              initialSelected={initialSelected}
              theme="light"
              colors={colors}
              notation="FDI"
              showTooltip={true}
              className="w-full react-odontogram"
              key={JSON.stringify(initialSelected)} // Force re-render when selection changes
            />
          </div>

          {/* Dialog để chọn tình trạng răng */}
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setSelectedTooth(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Chọn tình trạng răng</DialogTitle>
                <DialogDescription>
                  {selectedTooth !== null && `Răng số ${selectedTooth}`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-4">
                {TOOTH_STATUSES.map((status) => (
                  <Button
                    key={status.value}
                    variant="outline"
                    className={`h-auto flex-col items-start p-3 ${
                      selectedTooth !== null && toothStatusMap[selectedTooth] === status.value
                        ? 'border-2 border-primary bg-primary/5'
                        : ''
                    }`}
                    onClick={() => handleStatusSelect(status.value)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={`w-5 h-5 rounded border-2 ${status.bgColor}`}
                        style={{ borderColor: status.borderColor }}
                      />
                      <span className="text-sm font-medium">{status.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Legend */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Chú thích:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-white border-gray-300" />
                <span>Bình thường</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-amber-100 border-amber-400" />
                <span>Sâu răng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-blue-100 border-blue-400" />
                <span>Đã trám</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-purple-100 border-purple-400" />
                <span>Bọc răng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-gray-200 border-gray-400" />
                <span>Đã nhổ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 bg-red-100 border-red-400" />
                <span>Điều trị tủy</span>
              </div>
            </div>
          </div>

          {/* Selected Teeth Info */}
          {Object.keys(toothStatusMap).length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Răng đã được đánh dấu: {Object.keys(toothStatusMap).length} răng
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(toothStatusMap).map(([toothNumber, status]) => {
                  const statusConfig = TOOTH_STATUSES.find((s) => s.value === status);
                  return (
                    <span
                      key={toothNumber}
                      className="text-xs px-2 py-1 rounded bg-white border text-gray-700"
                      style={{
                        borderColor: statusConfig?.borderColor || '#d1d5db',
                        backgroundColor: statusConfig?.color || '#ffffff',
                      }}
                    >
                      Răng {toothNumber} - {statusConfig?.label || status}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OdontogramView;
