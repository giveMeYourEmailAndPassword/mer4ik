import { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import type { MerchTemplate, UserImage } from '../types';
import { ImageControls } from './ImageControls';
import { IconButton } from './ui/IconButton';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { useImageExport } from '../hooks/useImageExport';
import { ArrowLeft, Download, Upload } from 'lucide-react';

interface MerchEditorProps {
  template: MerchTemplate;
  onBack: () => void;
}

export const MerchEditor: React.FC<MerchEditorProps> = ({
  template,
  onBack
}) => {
  const [userImage, setUserImage] = useState<UserImage | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const { exportAndDownload } = useImageExport();

  // Обработчик загрузки изображения
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Масштабируем изображение под печатную область
          const maxWidth = template.printableArea.width * 0.8;
          const maxHeight = template.printableArea.height * 0.8;

          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }

          const newUserImage: UserImage = {
            id: Date.now().toString(),
            src: e.target?.result as string,
            x: template.printableArea.x + (template.printableArea.width - width) / 2,
            y: template.printableArea.y + (template.printableArea.height - height) / 2,
            width,
            height,
            rotation: 0,
            opacity: 1
          };

          setUserImage(newUserImage);
          imageRef.current = img;
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, [template]);

  // Обработчики изменений изображения
  const handleImageChange = useCallback((updates: Partial<UserImage>) => {
    if (userImage) {
      setUserImage({ ...userImage, ...updates });
    }
  }, [userImage]);

  // Сохранение изображения с расширенными опциями
  const handleDownload = useCallback(async (format: 'png' | 'jpeg' = 'png') => {
    if (stageRef.current && userImage) {
      try {
        await exportAndDownload(stageRef.current, template, userImage, {
          format,
          quality: format === 'jpeg' ? 0.9 : 1,
          pixelRatio: 2,
          backgroundColor: format === 'jpeg' ? '#ffffff' : 'transparent'
        });
      } catch (err) {
        console.error('Download failed:', err);
        alert('Не удалось сохранить изображение. Попробуйте еще раз.');
      }
    } else {
      alert('Сначала загрузите изображение!');
    }
  }, [template, userImage, exportAndDownload]);

  // Отслеживание выделения элемента
  const handleStageClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Проверка, является ли устройство тач-устройством
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Тач-жесты для mobile
  useTouchGestures(stageContainerRef, {
    onPinch: (scale) => {
      if (!userImage || !stageRef.current) return;

      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();

      if (pointerPos) {
        const newWidth = userImage.width * scale;
        const newHeight = userImage.height * scale;

        setUserImage(prev => prev ? {
          ...prev,
          width: Math.max(20, Math.min(300, newWidth)),
          height: Math.max(20, Math.min(300, newHeight))
        } : null);
      }
    },
    onRotate: (rotation) => {
      if (!userImage) return;

      setUserImage(prev => prev ? {
        ...prev,
        rotation: (prev.rotation + rotation) % 360
      } : null);
    },
    onDrag: (deltaX, deltaY) => {
      if (!userImage) return;

      setUserImage(prev => prev ? {
        ...prev,
        x: Math.max(template.printableArea.x,
               Math.min(template.printableArea.x + template.printableArea.width - prev.width,
                      prev.x + deltaX)),
        y: Math.max(template.printableArea.y,
               Math.min(template.printableArea.y + template.printableArea.height - prev.height,
                      prev.y + deltaY))
      } : null);
    },
    onDoubleTap: () => {
      // При двойном тапе сбрасываем трансформации
      if (userImage) {
        setUserImage({
          ...userImage,
          rotation: 0,
          opacity: 1
        });
      }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <IconButton onClick={onBack} className="p-2">
            <ArrowLeft size={24} />
          </IconButton>
          <h1 className="text-lg font-semibold capitalize">{template.name}</h1>
        </div>
        <IconButton onClick={handleDownload} className="bg-green-500 hover:bg-green-600">
          <Download size={24} className="text-white" />
        </IconButton>
      </div>

      {/* Canvas Area */}
      <div ref={stageContainerRef} className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="max-w-sm mx-auto">
          <Stage
            ref={stageRef}
            width={template.canvasWidth}
            height={template.canvasHeight}
            onClick={handleStageClick}
            onTap={handleStageClick}
            className="bg-white rounded-lg shadow-lg mx-auto"
          >
            <Layer>
              {/* Шаблон товара */}
              {(() => {
                const img = new Image();
                img.src = template.imageUrl;
                return <KonvaImage
                  image={img}
                  width={template.canvasWidth}
                  height={template.canvasHeight}
                />;
              })()}

              {/* Rectangle для printable area */}
              {userImage && (
                <Rect
                  x={template.printableArea.x}
                  y={template.printableArea.y}
                  width={template.printableArea.width}
                  height={template.printableArea.height}
                  stroke="#ddd"
                  strokeWidth={2}
                  dash={[5, 5]}
                  fill="rgba(0,0,0,0.02)"
                />
              )}

              {/* Изображение пользователя */}
              {userImage && imageRef.current && (
                <KonvaImage
                  image={imageRef.current}
                  x={userImage.x}
                  y={userImage.y}
                  width={userImage.width}
                  height={userImage.height}
                  rotation={userImage.rotation}
                  opacity={userImage.opacity}
                  draggable={!isTouchDevice}
                  onDragEnd={(e) => {
                    if (!isTouchDevice) {
                      handleImageChange({
                        x: e.target.x(),
                        y: e.target.y()
                      });
                    }
                  }}
                  onTap={() => !isTouchDevice && setSelectedNode(event.currentTarget)}
                  onClick={() => !isTouchDevice && setSelectedNode(event.currentTarget)}
                />
              )}

              {/* Transformer для выделенного элемента (только для десктопа) */}
              {selectedNode && !isTouchDevice && (
                <Transformer
                  node={selectedNode}
                  visible={true}
                  enabled={true}
                  keepRatio={true}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Ограничение размера печатной областью
                    if (newBox.width < 20) return oldBox;
                    if (newBox.height < 20) return oldBox;

                    // Проверка выхода за пределы printable area
                    if (newBox.x < template.printableArea.x) {
                      newBox.x = template.printableArea.x;
                    }
                    if (newBox.y < template.printableArea.y) {
                      newBox.y = template.printableArea.y;
                    }

                    return newBox;
                  }}
                  onTransformEnd={(e) => {
                    if (userImage) {
                      const node = selectedNode;
                      handleImageChange({
                        x: node.x(),
                        y: node.y(),
                        width: node.width() * node.scaleX(),
                        height: node.height() * node.scaleY(),
                        rotation: node.rotation()
                      });

                      // Сбрасываем масштаб после трансформации
                      node.scaleX(1);
                      node.scaleY(1);
                    }
                  }}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-white shadow-lg border-t border-gray-200">
        <div className="p-4">
          {/* Upload Button */}
          {!userImage && (
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg
                         font-medium flex items-center justify-center space-x-2
                         active:scale-95 transition-transform"
              >
                <Upload size={20} />
                <span>Загрузить изображение</span>
              </button>
            </div>
          )}

          {/* Image Controls */}
          {userImage && (
            <ImageControls
              image={userImage}
              onChange={handleImageChange}
              onUploadNew={() => fileInputRef.current?.click()}
            />
          )}
        </div>
      </div>
    </div>
  );
};