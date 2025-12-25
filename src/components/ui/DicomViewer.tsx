import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';
import { dicomAPI, type DicomStudyResponse } from '@/services';
import { Loader2, X, Ruler, CornerDownRight, Move, ZoomIn, Contrast } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { store } from '@/store';

interface DicomViewerProps {
  open: boolean;
  studyId: string | null;
  onClose: () => void;
}

const DicomViewer: React.FC<DicomViewerProps> = ({ open, studyId, onClose }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const renderingEngineRef = useRef<any>(null);
  const viewportIdRef = useRef<string>('dicom-viewport');
  const [study, setStudy] = useState<DicomStudyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSeriesIndex, setCurrentSeriesIndex] = useState(0);
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<'windowlevel' | 'pan' | 'zoom' | 'length' | 'angle'>('windowlevel');
  const cornerstoneInitialized = useRef(false);
  const toolGroupRef = useRef<any>(null);
  const toolsAddedRef = useRef<Set<string>>(new Set());
  const viewportAddedRef = useRef<boolean>(false);
  const imageIdsCacheRef = useRef<{ seriesIndex: number; imageIds: string[] } | null>(null);

  useEffect(() => {
    if (!open || !studyId) return;

    const loadStudy = async () => {
      setLoading(true);
      setError(null);
      try {
        const studyData = await dicomAPI.getStudyById(studyId);
        setStudy(studyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load DICOM study');
      } finally {
        setLoading(false);
      }
    };

    loadStudy();
  }, [open, studyId]);

  useEffect(() => {
    if (!open || !study || !viewportRef.current) return;

    let isMounted = true;

    const initializeCornerstone = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const cornerstoneCore = await import('@cornerstonejs/core');
        const cornerstoneTools = await import('@cornerstonejs/tools');
        const dicomImageLoaderModule = await import('@cornerstonejs/dicom-image-loader');
        const dicomParser = await import('dicom-parser');

        // Initialize Cornerstone libraries
        if (!cornerstoneInitialized.current) {
          await cornerstoneCore.init();
          await cornerstoneTools.init();
          
          // @cornerstonejs/dicom-image-loader v1.86.0 setup
          // The module exports as a namespace object
          // In newer versions, we may need to set external differently
          
          // Set external dependencies on global scope (some loaders check this)
          (globalThis as any).cornerstone = cornerstoneCore;
          (globalThis as any).dicomParser = dicomParser;
          
          // Access the module - could be default export or namespace
          const dicomImageLoader = (dicomImageLoaderModule as any).default || dicomImageLoaderModule;
          
          // Log for debugging
          console.log('DICOM Image Loader type:', typeof dicomImageLoader);
          if (dicomImageLoader && typeof dicomImageLoader === 'object') {
            console.log('DICOM Image Loader keys:', Object.keys(dicomImageLoader));
          }
          
          // Create a proxy to provide external property without modifying the original object
          const loaderWithExternal = new Proxy(dicomImageLoader || {}, {
            get(target: any, prop: string | symbol) {
              if (prop === 'external') {
                return {
                  cornerstone: cornerstoneCore,
                  dicomParser: dicomParser,
                };
              }
              return target[prop];
            },
            has(target: any, prop: string | symbol) {
              return prop === 'external' || prop in target;
            },
            ownKeys(target: any) {
              return ['external', ...Object.keys(target)];
            },
            getOwnPropertyDescriptor(target: any, prop: string | symbol) {
              if (prop === 'external') {
                return {
                  enumerable: true,
                  configurable: true,
                  value: {
                    cornerstone: cornerstoneCore,
                    dicomParser: dicomParser,
                  }
                };
              }
              return Object.getOwnPropertyDescriptor(target, prop);
            }
          });
          
          // Configure DICOM image loader using proxy
          // Need to add Authorization header for authenticated requests
          if (typeof loaderWithExternal.configure === 'function') {
            loaderWithExternal.configure({
              beforeSend: (xhr: XMLHttpRequest) => {
                // Get token from Redux store
                try {
                  const state = store.getState();
                  const token = state.auth?.token;
                  
                  // Add Authorization header if token is available
                  if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                  }
                } catch (e) {
                  console.warn('Failed to get token from store:', e);
                }
              },
            });
          }
          
          // Register image loaders with Cornerstone
          const { imageLoader } = cornerstoneCore;
          
          // From console log, we see the module has 'wadouri' key (not 'wadouriLoader')
          // The wadouri object should have a loadImage function
          const wadouri = loaderWithExternal.wadouri || dicomImageLoader?.wadouri;
          
          console.log('WADOURI object:', wadouri);
          console.log('WADOURI type:', typeof wadouri);
          if (wadouri && typeof wadouri === 'object') {
            console.log('WADOURI keys:', Object.keys(wadouri));
          }
          
          // The wadouri object should have a loadImage method
          // In @cornerstonejs/dicom-image-loader, wadouri is an object with loadImage function
          const wadouriLoader = wadouri?.loadImage || wadouri;
          
          if (wadouriLoader && typeof imageLoader.registerImageLoader === 'function') {
            imageLoader.registerImageLoader('wadouri', wadouriLoader);
            console.log('Successfully registered wadouri loader');
          } else {
            console.error('Failed to register wadouri loader');
            console.error('Available exports:', Object.keys(dicomImageLoaderModule));
            console.error('wadouri object:', wadouri);
            throw new Error('Failed to register DICOM image loader: wadouri not found or invalid');
          }

          cornerstoneInitialized.current = true;
        }

        if (!isMounted) return;

        // Create RenderingEngine
        const renderingEngineId = 'dicom-rendering-engine';
        const { RenderingEngine, Enums } = cornerstoneCore;
        
        if (!renderingEngineRef.current) {
          renderingEngineRef.current = new RenderingEngine(renderingEngineId);
        }

        const renderingEngine = renderingEngineRef.current;
        const element = viewportRef.current!;
        const viewportId = viewportIdRef.current;

        // Enable viewport
        const viewportInput = {
          viewportId,
          element,
          type: Enums.ViewportType.STACK,
        };

        renderingEngine.enableElement(viewportInput);

        // Get viewport and load images
        if (study.series && study.series.length > 0) {
          const currentSeries = study.series[currentSeriesIndex];
          if (currentSeries.instances && currentSeries.instances.length > 0) {
            // Cache imageIds array - only recreate when series changes
            let imageIds: string[];
            if (imageIdsCacheRef.current?.seriesIndex === currentSeriesIndex) {
              // Use cached imageIds if same series
              imageIds = imageIdsCacheRef.current.imageIds;
            } else {
              // Create imageIds array for all instances in the series (only when series changes)
              imageIds = currentSeries.instances.map((instance) =>
                dicomAPI.getDicomImageUrl(instance.orthancInstanceId)
              );
              // Cache the imageIds for this series
              imageIdsCacheRef.current = {
                seriesIndex: currentSeriesIndex,
                imageIds: imageIds,
              };
            }

            // Don't set stack here - it will be set in separate useEffect when image index changes
            // This useEffect only creates imageIds cache and sets up tools

            // Enable tools using ToolGroupManager
            const { 
              WindowLevelTool, 
              PanTool, 
              ZoomTool, 
              StackScrollMouseWheelTool,
              LengthTool,
              AngleTool,
              ToolGroupManager,
              Enums: ToolsEnums 
            } = cornerstoneTools;
            
            // Add tools to library (only if not already added)
            // Check if tools are already registered to avoid "already been added globally" errors
            try {
              cornerstoneTools.addTool(WindowLevelTool);
            } catch (e: any) {
              if (!e.message?.includes('already been added')) {
                console.warn('Failed to add WindowLevelTool:', e);
              }
            }
            try {
              cornerstoneTools.addTool(PanTool);
            } catch (e: any) {
              if (!e.message?.includes('already been added')) {
                console.warn('Failed to add PanTool:', e);
              }
            }
            try {
              cornerstoneTools.addTool(ZoomTool);
            } catch (e: any) {
              if (!e.message?.includes('already been added')) {
                console.warn('Failed to add ZoomTool:', e);
              }
            }
            try {
              cornerstoneTools.addTool(StackScrollMouseWheelTool);
            } catch (e: any) {
              if (!e.message?.includes('already been added')) {
                console.warn('Failed to add StackScrollMouseWheelTool:', e);
              }
            }
            try {
              cornerstoneTools.addTool(LengthTool);
            } catch (e: any) {
              if (!e.message?.includes('already been added')) {
                console.warn('Failed to add LengthTool:', e);
              }
            }
            try {
              cornerstoneTools.addTool(AngleTool);
            } catch (e: any) {
              if (!e.message?.includes('already been added')) {
                console.warn('Failed to add AngleTool:', e);
              }
            }

            // Create or get tool group
            const toolGroupId = 'dicom-tool-group';
            let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
            const isNewToolGroup = !toolGroup;
            if (!toolGroup) {
              toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
              // Reset tracking when creating new ToolGroup
              toolsAddedRef.current.clear();
              viewportAddedRef.current = false;
            }

            // Add tools to tool group (only if not already added)
            const toolNames = [
              WindowLevelTool.toolName,
              PanTool.toolName,
              ZoomTool.toolName,
              StackScrollMouseWheelTool.toolName,
              LengthTool.toolName,
              AngleTool.toolName,
            ];
            
            for (const toolName of toolNames) {
              // Check if tool already added to avoid warnings
              if (!toolsAddedRef.current.has(toolName)) {
                try {
                  toolGroup.addTool(toolName);
                  toolsAddedRef.current.add(toolName);
                } catch (e: any) {
                  // If addTool fails, mark as added anyway to prevent retry
                  toolsAddedRef.current.add(toolName);
                  if (!e.message?.includes('already registered')) {
                    console.warn(`Failed to add tool ${toolName}:`, e);
                  }
                }
              }
            }

            // Add viewport to tool group (only if not already added)
            if (!viewportAddedRef.current) {
              try {
                toolGroup.addViewport(viewportId, renderingEngineId);
                viewportAddedRef.current = true;
              } catch (e: any) {
                // If addViewport fails, mark as added anyway to prevent retry
                viewportAddedRef.current = true;
                if (!e.message?.includes('already') && !e.message?.includes('registered')) {
                  console.warn('Failed to add viewport to tool group:', e);
                }
              }
            }

            // Store tool group reference
            toolGroupRef.current = toolGroup;

            // Don't activate tools here - wait until viewport has images
            // Tools will be activated in the updateImage useEffect after setStack
          }
        }
      } catch (initError) {
        console.error('Failed to initialize Cornerstone:', initError);
        if (isMounted) {
          setError('Failed to initialize DICOM viewer: ' + (initError instanceof Error ? initError.message : 'Unknown error'));
        }
      }
    };

    initializeCornerstone();

    // Cleanup
    return () => {
      isMounted = false;
      // Reset tracking when component unmounts
      toolsAddedRef.current.clear();
      viewportAddedRef.current = false;
      // Clear imageIds cache when component unmounts
      imageIdsCacheRef.current = null;
      
      if (renderingEngineRef.current && viewportRef.current) {
        try {
          const viewportId = viewportIdRef.current;
          const renderingEngine = renderingEngineRef.current;
          renderingEngine.disableElement(viewportId);
        } catch (e) {
          console.error('Error during cleanup:', e);
        }
      }
    };
  }, [open, study, currentSeriesIndex]); // Only run when series changes, not when image index changes

  // Separate useEffect to update image index (only update stack, don't recreate imageIds)
  useEffect(() => {
    if (!open || !study || !viewportRef.current || !renderingEngineRef.current) return;
    if (!imageIdsCacheRef.current || imageIdsCacheRef.current.seriesIndex !== currentSeriesIndex) return;

    const updateImage = async () => {
      try {
        const renderingEngine = renderingEngineRef.current;
        const viewportId = viewportIdRef.current;
        const viewport = renderingEngine.getViewport(viewportId);
        const imageIds = imageIdsCacheRef.current!.imageIds;

        // Only update stack with new image index
        await viewport.setStack(imageIds, currentInstanceIndex);
        viewport.render();

        // Activate tools only after viewport has images in stack
        if (toolGroupRef.current) {
          try {
            const cornerstoneTools = await import('@cornerstonejs/tools');
            const { WindowLevelTool, PanTool, ZoomTool, Enums: ToolsEnums } = cornerstoneTools;
            const toolGroup = toolGroupRef.current;

            // Check if viewport has images before activating tools
            const stack = (viewport as any).getStack?.();
            if (stack && stack.imageIds && stack.imageIds.length > 0) {
              // Activate tools only if not already active
              try {
                toolGroup.setToolActive(WindowLevelTool.toolName, {
                  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
                });
              } catch (e: any) {
                // Tool might already be active, ignore
              }
              try {
                toolGroup.setToolActive(PanTool.toolName, {
                  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Auxiliary }],
                });
              } catch (e: any) {
                // Tool might already be active, ignore
              }
              try {
                toolGroup.setToolActive(ZoomTool.toolName, {
                  bindings: [{ mouseButton: ToolsEnums.MouseBindings.Secondary }],
                });
              } catch (e: any) {
                // Tool might already be active, ignore
              }
            }
          } catch (toolError) {
            console.warn('Failed to activate tools:', toolError);
          }
        }
      } catch (error) {
        console.error('Failed to update image:', error);
      }
    };

    updateImage();
  }, [open, study, currentInstanceIndex, currentSeriesIndex]); // Update when image index changes

  // Handle mouse wheel scroll to change images
  useEffect(() => {
    if (!open || !viewportRef.current || !study?.series?.[currentSeriesIndex]?.instances) return;

    const element = viewportRef.current;
    const instances = study.series[currentSeriesIndex].instances || [];
    const maxIndex = instances.length - 1;

    const handleWheel = (event: WheelEvent) => {
      // Check if we have instances to scroll through
      if (instances.length === 0 || maxIndex < 0) {
        return;
      }

      // Prevent default scrolling behavior
      // This works because we use addEventListener with { passive: false }
      event.preventDefault();
      event.stopPropagation();
      
      // Determine scroll direction
      const deltaY = event.deltaY;
      
      if (deltaY > 0) {
        // Scroll down: next image
        setCurrentInstanceIndex((prevIndex) => {
          return prevIndex < maxIndex ? prevIndex + 1 : prevIndex;
        });
      } else if (deltaY < 0) {
        // Scroll up: previous image
        setCurrentInstanceIndex((prevIndex) => {
          return prevIndex > 0 ? prevIndex - 1 : prevIndex;
        });
      }
    };

    // Add event listener with passive: false to allow preventDefault
    // This is the key - passive: false allows us to call preventDefault()
    element.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [open, study, currentSeriesIndex]); // Don't include currentInstanceIndex to avoid re-creating listener

  // Update active tool when it changes
  useEffect(() => {
    if (!toolGroupRef.current || !open) return;

    const updateTool = async () => {
      try {
        const cornerstoneTools = await import('@cornerstonejs/tools');
        const toolGroup = toolGroupRef.current;
        if (!toolGroup) return;

        const { 
          WindowLevelTool, 
          PanTool, 
          ZoomTool, 
          LengthTool,
          AngleTool,
          Enums: ToolsEnums 
        } = cornerstoneTools;

        // Deactivate all tools first
        toolGroup.setToolPassive(WindowLevelTool.toolName);
        toolGroup.setToolPassive(PanTool.toolName);
        toolGroup.setToolPassive(ZoomTool.toolName);
        toolGroup.setToolPassive(LengthTool.toolName);
        toolGroup.setToolPassive(AngleTool.toolName);

        // Activate selected tool
        switch (activeTool) {
          case 'windowlevel':
            toolGroup.setToolActive(WindowLevelTool.toolName, {
              bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
            });
            break;
          case 'pan':
            toolGroup.setToolActive(PanTool.toolName, {
              bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
            });
            break;
          case 'zoom':
            toolGroup.setToolActive(ZoomTool.toolName, {
              bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
            });
            break;
          case 'length':
            toolGroup.setToolActive(LengthTool.toolName, {
              bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
            });
            break;
          case 'angle':
            toolGroup.setToolActive(AngleTool.toolName, {
              bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
            });
            break;
        }
      } catch (error) {
        console.error('Failed to update tool:', error);
      }
    };

    updateTool();
  }, [activeTool, open]);

  const handleNextInstance = () => {
    if (!study?.series?.[currentSeriesIndex]?.instances) return;
    const instances = study.series[currentSeriesIndex].instances || [];
    if (currentInstanceIndex < instances.length - 1) {
      setCurrentInstanceIndex(currentInstanceIndex + 1);
    }
  };

  const handlePrevInstance = () => {
    if (currentInstanceIndex > 0) {
      setCurrentInstanceIndex(currentInstanceIndex - 1);
    }
  };

  const handleNextSeries = () => {
    if (!study?.series) return;
    if (currentSeriesIndex < study.series.length - 1) {
      setCurrentSeriesIndex(currentSeriesIndex + 1);
      setCurrentInstanceIndex(0);
    }
  };

  const handlePrevSeries = () => {
    if (currentSeriesIndex > 0) {
      setCurrentSeriesIndex(currentSeriesIndex - 1);
      setCurrentInstanceIndex(0);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-[50vw] !max-w-[50vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {study?.studyDescription || 'DICOM Viewer'}
          </DialogTitle>
          <DialogDescription>
            {study 
              ? `DICOM Study: ${study.modality} - ${study.studyDate} ${study.studyTime || ''}`.trim()
              : 'View DICOM medical images'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-4 bg-gray-900 text-white">
            <div>
              <h3 className="text-lg font-semibold">
                {study?.studyDescription || 'DICOM Viewer'}
              </h3>
              {study && (
                <p className="text-sm text-gray-400">
                  {study.modality} - {study.studyDate} {study.studyTime}
                </p>
              )}
            </div>
          </div>

          {/* Toolbar */}
          {study && study.series && study.series.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-gray-800 text-white flex-wrap">
              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevSeries}
                  disabled={currentSeriesIndex === 0}
                  className="text-white hover:bg-gray-700"
                >
                  ← Series
                </Button>
                <span className="text-sm">
                  Series {currentSeriesIndex + 1} / {study.series.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextSeries}
                  disabled={currentSeriesIndex === study.series.length - 1}
                  className="text-white hover:bg-gray-700"
                >
                  Series →
                </Button>
                <div className="w-px h-6 bg-gray-600 mx-2" />
                {study.series[currentSeriesIndex]?.instances && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevInstance}
                      disabled={currentInstanceIndex === 0}
                      className="text-white hover:bg-gray-700"
                    >
                      ← Image
                    </Button>
                    <span className="text-sm">
                      Image {currentInstanceIndex + 1} /{' '}
                      {study.series[currentSeriesIndex].instances?.length || 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextInstance}
                      disabled={
                        currentInstanceIndex >=
                        (study.series[currentSeriesIndex].instances?.length || 0) - 1
                      }
                      className="text-white hover:bg-gray-700"
                    >
                      Image →
                    </Button>
                  </>
                )}
              </div>

              {/* Tool Selection */}
              <div className="w-px h-6 bg-gray-600 mx-2" />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 mr-2">Tools:</span>
                <Button
                  variant={activeTool === 'windowlevel' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('windowlevel')}
                  className="text-white hover:bg-gray-700"
                  title="Window/Level (Left Click + Drag)"
                >
                  <Contrast className="h-3 w-3 mr-1" />
                  W/L
                </Button>
                <Button
                  variant={activeTool === 'pan' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('pan')}
                  className="text-white hover:bg-gray-700"
                  title="Pan (Left Click + Drag)"
                >
                  <Move className="h-3 w-3 mr-1" />
                  Pan
                </Button>
                <Button
                  variant={activeTool === 'zoom' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('zoom')}
                  className="text-white hover:bg-gray-700"
                  title="Zoom (Left Click + Drag)"
                >
                  <ZoomIn className="h-3 w-3 mr-1" />
                  Zoom
                </Button>
                <Button
                  variant={activeTool === 'length' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('length')}
                  className="text-white hover:bg-gray-700"
                  title="Length Measurement (Left Click to draw)"
                >
                  <Ruler className="h-3 w-3 mr-1" />
                  Length
                </Button>
                <Button
                  variant={activeTool === 'angle' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTool('angle')}
                  className="text-white hover:bg-gray-700"
                  title="Angle Measurement (Left Click to draw)"
                >
                  <CornerDownRight className="h-3 w-3 mr-1" />
                  Angle
                </Button>
              </div>
            </div>
          )}

          {/* Viewport */}
          <div className="flex-1 relative bg-black overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            <div
              ref={viewportRef}
              className="w-full h-full"
              style={{ minHeight: '600px' }}
            />
          </div>

          {/* Instructions */}
          <div className="p-2 bg-gray-900 text-white text-xs">
            <p>
              <strong>Active Tool: {activeTool === 'windowlevel' ? 'Window/Level' : activeTool === 'pan' ? 'Pan' : activeTool === 'zoom' ? 'Zoom' : activeTool === 'length' ? 'Length Measurement' : 'Angle Measurement'}</strong>
              {' | '}
              Left Click + Drag: Use active tool | Mouse Wheel: Scroll images | Right Click: Zoom
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DicomViewer;

