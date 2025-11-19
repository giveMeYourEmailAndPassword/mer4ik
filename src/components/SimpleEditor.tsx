import React, { useState, useRef, useCallback } from 'react';
import type { MerchTemplate, UserImage } from '../types';
import type { ChangeEvent } from 'react';
import { IconButton } from './ui/IconButton';
import { ArrowLeft, Download, Upload, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface SimpleEditorProps {
  template: MerchTemplate;
  onBack: () => void;
  userImage: UserImage | null;
  setUserImage: (image: UserImage | null) => void;
  onSwitchTemplate: (templateId: string) => void;
}

export const SimpleEditor = ({
  template,
  onBack,
  userImage,
  setUserImage,
  onSwitchTemplate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showPrintArea, setShowPrintArea] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedImage, setDraggedImage] = useState<UserImage | null>(null);

  // Обработчик загрузки изображения
  const handleImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
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
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, [template, setUserImage]);

  // Обработчики мышью
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!userImage || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (template.canvasWidth / rect.width);
    const y = (e.clientY - rect.top) * (template.canvasHeight / rect.height);

    // Проверяем, кликнули ли на изображение
    if (
      x >= userImage.x &&
      x <= userImage.x + userImage.width &&
      y >= userImage.y &&
      y <= userImage.y + userImage.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - userImage.x, y: y - userImage.y });
    }
  }, [userImage, template]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !userImage || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (template.canvasWidth / rect.width);
    const y = (e.clientY - rect.top) * (template.canvasHeight / rect.height);

    const newX = Math.max(
      template.printableArea.x,
      Math.min(
        template.printableArea.x + template.printableArea.width - userImage.width,
        x - dragStart.x
      )
    );

    const newY = Math.max(
      template.printableArea.y,
      Math.min(
        template.printableArea.y + template.printableArea.height - userImage.height,
        y - dragStart.y
      )
    );

    // Обновляем временное изображение без ререндера компонента
    const newDraggedImage = { ...userImage, x: newX, y: newY };
    setDraggedImage(newDraggedImage);

    // Рисуем напрямую на canvas без ререндера
    drawCanvasWithImage(newDraggedImage);
  }, [isDragging, userImage, dragStart, template]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    // Сохраняем финальную позицию если было перетаскивание
    if (draggedImage) {
      setUserImage(draggedImage);
      setDraggedImage(null);
    }
  }, [draggedImage, setUserImage]);

  // Обработчики тач-событий
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!userImage || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (template.canvasWidth / rect.width);
    const y = (touch.clientY - rect.top) * (template.canvasHeight / rect.height);

    if (
      x >= userImage.x &&
      x <= userImage.x + userImage.width &&
      y >= userImage.y &&
      y <= userImage.y + userImage.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - userImage.x, y: y - userImage.y });
      e.preventDefault();
    }
  }, [userImage, template]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !userImage || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (template.canvasWidth / rect.width);
    const y = (touch.clientY - rect.top) * (template.canvasHeight / rect.height);

    const newX = Math.max(
      template.printableArea.x,
      Math.min(
        template.printableArea.x + template.printableArea.width - userImage.width,
        x - dragStart.x
      )
    );

    const newY = Math.max(
      template.printableArea.y,
      Math.min(
        template.printableArea.y + template.printableArea.height - userImage.height,
        y - dragStart.y
      )
    );

    // Обновляем временное изображение без ререндера компонента
    const newDraggedImage = { ...userImage, x: newX, y: newY };
    setDraggedImage(newDraggedImage);

    // Рисуем напрямую на canvas без ререндера
    drawCanvasWithImage(newDraggedImage);
    e.preventDefault();
  }, [isDragging, userImage, dragStart, template]);

  const drawCanvasWithImage = useCallback((imageOverride?: UserImage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, template.canvasWidth, template.canvasHeight);

    // Рисуем шаблон
    const templateImg = new Image();
    templateImg.onload = () => {
      ctx.drawImage(templateImg, 0, 0, template.canvasWidth, template.canvasHeight);

      // Рисуем печатную область
      if (showPrintArea) {
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          template.printableArea.x,
          template.printableArea.y,
          template.printableArea.width,
          template.printableArea.height
        );
        ctx.setLineDash([]);
      }

      // Рисуем изображение пользователя (или override)
      const currentImage = imageOverride || userImage;
      if (currentImage) {
        ctx.save();

        // Применяем трансформации
        ctx.globalAlpha = currentImage.opacity;
        ctx.translate(
          currentImage.x + currentImage.width / 2,
          currentImage.y + currentImage.height / 2
        );
        ctx.rotate((currentImage.rotation * Math.PI) / 180);

        const userImg = new Image();
        userImg.onload = () => {
          ctx.drawImage(
            userImg,
            -currentImage.width / 2,
            -currentImage.height / 2,
            currentImage.width,
            currentImage.height
          );
          ctx.restore();
        };
        userImg.src = currentImage.src;
      }
    };
    templateImg.src = template.imageUrl;
  }, [template, userImage, showPrintArea]);

  // Рисование на canvas
  const drawCanvas = useCallback(() => {
    drawCanvasWithImage();
  }, [drawCanvasWithImage]);

  // Обновляем canvas при изменениях (только не во время перетаскивания)
  React.useEffect(() => {
    // Не перерисовываем во время перетаскивания - canvas обновляется напрямую
    if (isDragging) return;

    drawCanvas();
  }, [drawCanvas, isDragging]);

  // Обработчики изменений
  const handleSizeChange = (factor: number) => {
    const currentImage = draggedImage || userImage;
    if (currentImage) {
      const updatedImage = {
        ...currentImage,
        width: currentImage.width * factor,
        height: currentImage.height * factor
      };

      if (isDragging) {
        setDraggedImage(updatedImage);
        drawCanvasWithImage(updatedImage);
      } else {
        setUserImage(updatedImage);
      }
    }
  };

  const handleRotate = () => {
    const currentImage = draggedImage || userImage;
    if (currentImage) {
      const updatedImage = {
        ...currentImage,
        rotation: (currentImage.rotation + 15) % 360
      };

      if (isDragging) {
        setDraggedImage(updatedImage);
        drawCanvasWithImage(updatedImage);
      } else {
        setUserImage(updatedImage);
      }
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const currentImage = draggedImage || userImage;
    if (canvas && currentImage) {
      const link = document.createElement('a');
      link.download = `merch-${template.name}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <IconButton onClick={onBack} className="p-2">
              <ArrowLeft size={24} />
            </IconButton>
            <div>
              <h1 className="text-lg font-semibold">{template.name}</h1>
              <p className="text-xs text-gray-500">Тяните логотип мышью или пальцем</p>
            </div>
          </div>
          <IconButton onClick={handleDownload} className="bg-green-500 hover:bg-green-600">
            <Download size={24} className="text-white" />
          </IconButton>
        </div>

        {/* Переключатель передняя/задняя сторона */}
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => onSwitchTemplate('tshirt-front')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                template.id === 'tshirt-front'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Перед
            </button>
            <button
              onClick={() => onSwitchTemplate('tshirt-back')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                template.id === 'tshirt-back'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Спина
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="max-w-sm mx-auto">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={template.canvasWidth}
              height={template.canvasHeight}
              className="bg-white rounded-lg shadow-lg mx-auto w-full max-w-full h-auto cursor-move"
              style={{ maxHeight: '600px', touchAction: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            />

                      </div>

          {/* Инструкции */}
          {userImage && (
            <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-1">💡 Как редактировать:</p>
              <ul className="text-xs space-y-1">
                <li>• Тяните логотип мышью или пальцем для перемещения</li>
                <li>• Используйте кнопки ниже для изменения размера</li>
                <li>• Печатная область ограничена пунктирной линией</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-white shadow-lg border-t border-gray-200">
        <div className="p-4">
          {/* Upload Button */}
          {!userImage ? (
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
                className="w-full bg-blue-600 text-white py-4 rounded-lg
                         font-medium flex items-center justify-center space-x-2
                         active:scale-95 transition-transform text-lg"
              >
                <Upload size={24} />
                <span>Загрузить логотип</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleSizeChange(1.2)}
                  className="p-3 bg-blue-100 rounded-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
                >
                  <ZoomIn size={20} className="text-blue-600" />
                  <span className="text-xs text-blue-600 mt-1">Увелич.</span>
                </button>

                <button
                  onClick={() => handleSizeChange(0.8)}
                  className="p-3 bg-blue-100 rounded-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
                >
                  <ZoomOut size={20} className="text-blue-600" />
                  <span className="text-xs text-blue-600 mt-1">Уменьш.</span>
                </button>

                <button
                  onClick={() => handleRotate()}
                  className="p-3 bg-purple-100 rounded-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
                >
                  <RotateCw size={20} className="text-purple-600" />
                  <span className="text-xs text-purple-600 mt-1">Повернуть</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-green-100 rounded-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
                >
                  <Upload size={20} className="text-green-600" />
                  <span className="text-xs text-green-600 mt-1">Новое</span>
                </button>
              </div>

              {/* Additional Controls */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <button
                  onClick={() => setShowPrintArea(!showPrintArea)}
                  className={`text-sm px-3 py-2 rounded ${
                    showPrintArea
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {showPrintArea ? 'Скрыть область' : 'Показать область'}
                </button>

                {userImage && (
                  <button
                    onClick={() => {
                      const currentImage = draggedImage || userImage;
                      const centeredImage = {
                        ...currentImage,
                        x: template.printableArea.x + (template.printableArea.width - currentImage.width) / 2,
                        y: template.printableArea.y + (template.printableArea.height - currentImage.height) / 2,
                        rotation: 0,
                        opacity: 1
                      };

                      if (isDragging) {
                        setDraggedImage(centeredImage);
                        drawCanvasWithImage(centeredImage);
                      } else {
                        setUserImage(centeredImage);
                      }
                    }}
                    className="text-sm px-3 py-2 bg-gray-500 text-white rounded"
                  >
                    Центрировать
                  </button>
                )}
              </div>

              {/* Image Info */}
              {userImage && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <p>Размер: {Math.round((draggedImage || userImage).width)}×{Math.round((draggedImage || userImage).height)}px</p>
                  <p>Поворот: {Math.round((draggedImage || userImage).rotation)}°</p>
                  <p>Прозрачность: {Math.round((draggedImage || userImage).opacity * 100)}%</p>
                  {draggedImage && (
                    <p className="text-blue-600">🔄 Перемещение...</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};