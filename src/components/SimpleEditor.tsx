import React, { useState, useRef, useCallback, useEffect } from "react";
import type { MerchTemplate, UserImage } from "../types";
import type { ChangeEvent } from "react";
import { IconButton } from "./ui/IconButton";
import {
  ArrowLeft,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";

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
  onSwitchTemplate,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showPrintArea, setShowPrintArea] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedImage, setDraggedImage] = useState<UserImage | null>(null);

  // Новые состояния для жестов
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState<number | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [showRotateSlider, setShowRotateSlider] = useState(false); // Показать слайдер вращения
  const [lastTapTime, setLastTapTime] = useState(0);

  // Обработчик загрузки изображения
  const handleImageUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
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
              x:
                template.printableArea.x +
                (template.printableArea.width - width) / 2,
              y:
                template.printableArea.y +
                (template.printableArea.height - height) / 2,
              width,
              height,
              rotation: 0,
              opacity: 1,
            };

            setUserImage(newUserImage);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    },
    [template, setUserImage]
  );

  // Обработчики мышью
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!userImage || !canvasRef.current) return;
      const currentTemplate = templateRef.current;

      const rect = canvasRef.current.getBoundingClientRect();
      const x =
        (e.clientX - rect.left) * (currentTemplate.canvasWidth / rect.width);
      const y =
        (e.clientY - rect.top) * (currentTemplate.canvasHeight / rect.height);

      // Проверяем, кликнули ли на изображение
      if (
        x >= userImage.x &&
        x <= userImage.x + userImage.width &&
        y >= userImage.y &&
        y <= userImage.y + userImage.height
      ) {
        // Предзагружаем изображение для перетаскивания
        if (!tempDragImageRef.current && userImageRef.current) {
          tempDragImageRef.current = userImageRef.current;
        }

        setIsDragging(true);
        setDragStart({ x: x - userImage.x, y: y - userImage.y });
      }
    },
    [userImage]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !userImage || !canvasRef.current) return;
      const currentTemplate = templateRef.current;

      const rect = canvasRef.current.getBoundingClientRect();
      const x =
        (e.clientX - rect.left) * (currentTemplate.canvasWidth / rect.width);
      const y =
        (e.clientY - rect.top) * (currentTemplate.canvasHeight / rect.height);

      const newX = Math.max(
        currentTemplate.printableArea.x,
        Math.min(
          currentTemplate.printableArea.x +
            currentTemplate.printableArea.width -
            userImage.width,
          x - dragStart.x
        )
      );

      const newY = Math.max(
        currentTemplate.printableArea.y,
        Math.min(
          currentTemplate.printableArea.y +
            currentTemplate.printableArea.height -
            userImage.height,
          y - dragStart.y
        )
      );

      // Обновляем временное изображение без ререндера компонента
      const newDraggedImage = { ...userImage, x: newX, y: newY };
      setDraggedImage(newDraggedImage);

      // Рисуем напрямую на canvas без ререндера
      drawCanvasWithImage(newDraggedImage);
    },
    [isDragging, userImage, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPinching(false);
    setInitialDistance(null);
    setInitialScale(null);

    // Сохраняем финальную позицию если было перетаскивание
    if (draggedImage) {
      setUserImage(draggedImage);
      setDraggedImage(null);
      // Очищаем временное изображение после завершения перетаскивания
      tempDragImageRef.current = null;
    }
  }, [draggedImage, setUserImage]);

  // Функция для расчета расстояния между двумя точками
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Функция для проверки, находится ли точка на изображении
  const isPointOnImage = (x: number, y: number, image: UserImage): boolean => {
    return (
      x >= image.x &&
      x <= image.x + image.width &&
      y >= image.y &&
      y <= image.y + image.height
    );
  };

  // Функция для обработки быстрого двойного касания
  const handleQuickTap = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const currentTime = Date.now();
      if (currentTime - lastTapTime < 300) {
        // Двойное касание - показываем слайдер вращения
        setShowRotateSlider(!showRotateSlider);
      }
      setLastTapTime(currentTime);
    },
    [lastTapTime, showRotateSlider]
  );

  // Обработчики тач-событий
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!userImage || !canvasRef.current) return;
      const currentTemplate = templateRef.current;

      const rect = canvasRef.current.getBoundingClientRect();

      // Обработка жеста масштабирования двумя пальцами
      if (e.touches.length === 2) {
        // Рассчитываем начальное расстояние между пальцами
        const distance = getDistance(e.touches[0], e.touches[1]);

        // Проверяем, находится ли хотя бы один палец на изображении
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const x1 =
          (touch1.clientX - rect.left) *
          (currentTemplate.canvasWidth / rect.width);
        const y1 =
          (touch1.clientY - rect.top) *
          (currentTemplate.canvasHeight / rect.height);
        const x2 =
          (touch2.clientX - rect.left) *
          (currentTemplate.canvasWidth / rect.width);
        const y2 =
          (touch2.clientY - rect.top) *
          (currentTemplate.canvasHeight / rect.height);

        const centerPointX = (x1 + x2) / 2;
        const centerPointY = (y1 + y2) / 2;

        if (isPointOnImage(centerPointX, centerPointY, userImage)) {
          setInitialDistance(distance);
          setInitialScale(userImage.width);
          setIsPinching(true);
          e.preventDefault();
          return;
        }
      }

      // Обработка одиночного касания
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const x =
          (touch.clientX - rect.left) *
          (currentTemplate.canvasWidth / rect.width);
        const y =
          (touch.clientY - rect.top) *
          (currentTemplate.canvasHeight / rect.height);

        // Проверяем быстрое касание для показа кнопки вращения
        handleQuickTap(e);

        if (isPointOnImage(x, y, userImage)) {
          // Предзагружаем изображение для перетаскивания
          if (!tempDragImageRef.current && userImageRef.current) {
            tempDragImageRef.current = userImageRef.current;
          }

          setIsDragging(true);
          // Сохраняем смещение для перемещения
          setDragStart({ x: x - userImage.x, y: y - userImage.y });
          e.preventDefault();
        }
      }
    },
    [userImage, handleQuickTap]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!userImage || !canvasRef.current) return;
      const currentTemplate = templateRef.current;
      const rect = canvasRef.current.getBoundingClientRect();

      // Обработка жеста масштабирования двумя пальцами
      if (
        e.touches.length === 2 &&
        isPinching &&
        initialDistance !== null &&
        initialScale !== null
      ) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;

        const newWidth = initialScale * scale;
        const newHeight = (userImage.height / userImage.width) * newWidth;

        // Ограничиваем минимальный и максимальный размеры
        const minWidth = 50;
        const maxWidth = Math.min(
          currentTemplate.printableArea.width,
          currentTemplate.printableArea.height
        );

        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        const clampedHeight =
          (userImage.height / userImage.width) * clampedWidth;

        const newImage = {
          ...userImage,
          width: clampedWidth,
          height: clampedHeight,
        };

        setDraggedImage(newImage);
        drawCanvasWithImage(newImage);
        e.preventDefault();
        return;
      }

      // Обработка перетаскивания одним пальцем
      if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0];

        // Режим перемещения
        const x =
          (touch.clientX - rect.left) *
          (currentTemplate.canvasWidth / rect.width);
        const y =
          (touch.clientY - rect.top) *
          (currentTemplate.canvasHeight / rect.height);

        const newX = Math.max(
          currentTemplate.printableArea.x,
          Math.min(
            currentTemplate.printableArea.x +
              currentTemplate.printableArea.width -
              userImage.width,
            x - dragStart.x
          )
        );

        const newY = Math.max(
          currentTemplate.printableArea.y,
          Math.min(
            currentTemplate.printableArea.y +
              currentTemplate.printableArea.height -
              userImage.height,
            y - dragStart.y
          )
        );

        // Обновляем временное изображение без ререндера компонента
        const newDraggedImage = { ...userImage, x: newX, y: newY };
        setDraggedImage(newDraggedImage);
        drawCanvasWithImage(newDraggedImage);
      }
    },
    [
      isDragging,
      isPinching,
      initialDistance,
      initialScale,
      userImage,
      dragStart,
      getDistance,
    ]
  );

  // Кешируем загруженные изображения чтобы избежать повторной загрузки
  const templateImageRef = useRef<HTMLImageElement | null>(null);
  const userImageRef = useRef<HTMLImageElement | null>(null);
  const tempDragImageRef = useRef<HTMLImageElement | null>(null);

  // Флаг для предотвращения двойной отрисовки
  const isDrawingRef = useRef(false);
  const animationFrameRef = useRef<number>();

  // Сохраняем template в ref чтобы избежать пересоздания функций
  const templateRef = useRef(template);
  templateRef.current = template;

  // Загружаем шаблон один раз и очищаем при смене
  React.useEffect(() => {
    // Очищаем предыдущее изображение шаблона
    templateImageRef.current = null;

    const img = new Image();
    img.onload = () => {
      templateImageRef.current = img;
      drawCanvas();
    };
    img.src = template.imageUrl;
  }, [template.imageUrl]);

  // Загружаем изображение пользователя при изменении
  React.useEffect(() => {
    if (userImage && userImage.src !== userImageRef.current?.src) {
      const img = new Image();
      img.onload = () => {
        userImageRef.current = img;
        drawCanvas();
      };
      img.src = userImage.src;
    } else if (!userImage) {
      userImageRef.current = null;
      drawCanvas();
    }
  }, [userImage?.src]);

  const drawCanvasWithImage = useCallback(
    (imageOverride?: UserImage) => {
      // Отменяем предыдущий запрос анимации
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Запускаем отрисовку в следующем кадре
      animationFrameRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas || isDrawingRef.current) return;

        const currentTemplate = templateRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Устанавливаем флаг, чтобы предотвратить двойную отрисовку
        isDrawingRef.current = true;

        try {
          // Очищаем canvas
          ctx.clearRect(
            0,
            0,
            currentTemplate.canvasWidth,
            currentTemplate.canvasHeight
          );

          // Рисуем шаблон (если загружен)
          if (templateImageRef.current) {
            ctx.drawImage(
              templateImageRef.current,
              0,
              0,
              currentTemplate.canvasWidth,
              currentTemplate.canvasHeight
            );

            // Рисуем печатную область
            if (showPrintArea) {
              ctx.strokeStyle = "#ddd";
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.strokeRect(
                currentTemplate.printableArea.x,
                currentTemplate.printableArea.y,
                currentTemplate.printableArea.width,
                currentTemplate.printableArea.height
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

              // Используем подходящее изображение
              const imageToDraw = imageOverride
                ? tempDragImageRef.current || userImageRef.current
                : userImageRef.current;

              if (imageToDraw) {
                ctx.drawImage(
                  imageToDraw,
                  -currentImage.width / 2,
                  -currentImage.height / 2,
                  currentImage.width,
                  currentImage.height
                );
              } else if (imageOverride && currentImage.src) {
                // Если нужно загрузить временное изображение для перетаскивания
                const tempImg = new Image();
                tempImg.onload = () => {
                  tempDragImageRef.current = tempImg;
                  ctx.drawImage(
                    tempImg,
                    -currentImage.width / 2,
                    -currentImage.height / 2,
                    currentImage.width,
                    currentImage.height
                  );
                  ctx.restore();
                  isDrawingRef.current = false;
                };
                tempImg.src = currentImage.src;
                return; // Выходим, так как отрисовка произойдет в onload
              }
              ctx.restore();
            }
          }
        } finally {
          isDrawingRef.current = false;
        }
      });
    },
    [userImage, showPrintArea]
  );

  // Рисование на canvas
  const drawCanvas = useCallback(() => {
    drawCanvasWithImage();
  }, [userImage, showPrintArea]);

  // Очистка при unmount
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Обновляем canvas при изменениях (только не во время перетаскивания)
  React.useEffect(() => {
    // Не перерисовываем во время перетаскивания - canvas обновляется напрямую
    if (isDragging) return;

    drawCanvas();
  }, [template, showPrintArea, isDragging, userImage, drawCanvas]);

  // Обработчики изменений
  const handleSizeChange = (factor: number) => {
    const currentImage = draggedImage || userImage;
    if (currentImage) {
      const updatedImage = {
        ...currentImage,
        width: currentImage.width * factor,
        height: currentImage.height * factor,
      };

      if (isDragging) {
        setDraggedImage(updatedImage);
        drawCanvasWithImage(updatedImage);
      } else {
        setUserImage(updatedImage);
      }
    }
  };

  const handleRotate = (rotation: number) => {
    const currentImage = draggedImage || userImage;
    if (currentImage) {
      const updatedImage = {
        ...currentImage,
        rotation: rotation,
      };

      if (isDragging) {
        setDraggedImage(updatedImage);
        drawCanvasWithImage(updatedImage);
      } else {
        setUserImage(updatedImage);
      }
    }
  };

  const handleQuickRotate = () => {
    const currentImage = draggedImage || userImage;
    if (currentImage) {
      handleRotate((currentImage.rotation + 15) % 360);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const currentImage = draggedImage || userImage;
    if (canvas && currentImage) {
      const link = document.createElement("a");
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
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="p-4 rounded-full bg-white shadow-lg active:scale-95
        transition-all duration-150 hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
             text-black px-3 py-2space-x-2
 min-w-[56px] min-h-[56px] flex items-center justify-center"
          >
            <Download size={24} />
          </button>
        </div>

        {/* Переключатель передняя/задняя сторона */}
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => onSwitchTemplate("tshirt-front")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                template.id === "tshirt-front"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Перед
            </button>
            <button
              onClick={() => onSwitchTemplate("tshirt-back")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                template.id === "tshirt-back"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Спина
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="max-w-sm mx-auto px-2">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={template.canvasWidth}
              height={template.canvasHeight}
              className="bg-white rounded-lg shadow-lg mx-auto w-full max-w-full h-auto cursor-move"
              style={{
                maxHeight: "min(600px, 70vh)",
                touchAction: "none",
                maxWidth: "100%",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            />

            {/* Слайдер вращения */}
            {userImage && showRotateSlider && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/60 backdrop-blur-sm p-6">
                <div className="max-w-md mx-auto">
                  {/* Заголовок с кнопкой закрытия */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <RotateCw size={16} className="text-white" />
                      </div>
                      <span className="text-white font-semibold text-base">
                        Вращение изображения
                      </span>
                    </div>
                    <button
                      onClick={() => setShowRotateSlider(false)}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 text-white"
                      aria-label="Закрыть"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Большой дисплей текущего угла */}
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm border-2 border-white/20">
                      <span className="text-white font-bold text-xl">
                        {Math.round((draggedImage || userImage).rotation)}°
                      </span>
                    </div>
                  </div>

                  {/* Основной слайдер */}
                  <div className="mb-4">
                    <div className="relative">
                      {/* Декоративная линия под слайдером */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 rounded-full -translate-y-1/2"></div>

                      <div className="flex items-center space-x-3 relative z-10">
                        <span className="text-white/70 text-xs font-medium min-w-[35px] text-right">-180°</span>

                        <div className="flex-1 relative">
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={(draggedImage || userImage).rotation}
                            onChange={(e) => handleRotate(Number(e.target.value))}
                            className="w-full h-3 bg-transparent appearance-none cursor-pointer slider-rotate"
                            style={{
                              background: `linear-gradient(to right,
                                #ec4899 0%,
                                #8b5cf6 ${
                                  ((Number((draggedImage || userImage).rotation) + 180) / 360) * 100
                                }%,
                                rgba(255,255,255,0.2) ${
                                  ((Number((draggedImage || userImage).rotation) + 180) / 360) * 100
                                }%,
                                rgba(255,255,255,0.2) 100%)`
                            }}
                          />

                          {/* Ползунок */}
                          <div
                            className="absolute top-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-purple-500 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                            style={{
                              left: `${((Number((draggedImage || userImage).rotation) + 180) / 360) * 100}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          </div>
                        </div>

                        <span className="text-white/70 text-xs font-medium min-w-[35px]">+180°</span>
                      </div>
                    </div>
                  </div>

                  {/* Кнопки быстрой настройки */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {[-90, -45, 0, 45, 90].map((angle) => (
                        <button
                          key={angle}
                          onClick={() => handleRotate(angle)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                            Math.abs((draggedImage || userImage).rotation - angle) < 1
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {angle === 0 ? '0°' : `${angle}°`}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleRotate(0)}
                      className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-all duration-200"
                    >
                      Сброс
                    </button>
                  </div>
                </div>

                {/* Стили для слайдера */}
                <style jsx>{`
                  .slider-rotate::-webkit-slider-thumb {
                    appearance: none;
                    width: 0;
                    height: 0;
                    opacity: 0;
                  }
                  .slider-rotate::-moz-range-thumb {
                    appearance: none;
                    width: 0;
                    height: 0;
                    opacity: 0;
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Инструкции */}
          {userImage && (
            <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-1">💡 Как редактировать:</p>
              <ul className="text-xs space-y-1">
                <li>
                  • <strong>1 палец:</strong> Перемещение логотипа
                </li>
                <li>
                  • <strong>2 пальца:</strong> Масштабирование
                  (сведите/раздвиньте пальцы)
                </li>
                <li>
                  • <strong>2 быстрых касания:</strong> Показать слайдер
                  вращения
                </li>
                {showRotateSlider && (
                  <li className="text-purple-700 font-medium">
                    🔄 <strong>Слайдер вращения:</strong> Регулируйте угол
                    поворота
                  </li>
                )}
                <li>• Печатная область ограничена пунктирной линией</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-white shadow-lg border-t border-gray-200">
        <div className="p-3 md:p-4">
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
                  onClick={() => handleQuickRotate()}
                  className="p-3 bg-purple-100 rounded-lg flex flex-col items-center justify-center active:scale-95 transition-transform"
                >
                  <RotateCw size={20} className="text-purple-600" />
                  <span className="text-xs text-purple-600 mt-1">
                    Повернуть
                  </span>
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
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  {showPrintArea ? "Скрыть область" : "Показать область"}
                </button>

                {userImage && (
                  <button
                    onClick={() => {
                      const currentImage = draggedImage || userImage;
                      const centeredImage = {
                        ...currentImage,
                        x:
                          template.printableArea.x +
                          (template.printableArea.width - currentImage.width) /
                            2,
                        y:
                          template.printableArea.y +
                          (template.printableArea.height -
                            currentImage.height) /
                            2,
                        rotation: 0,
                        opacity: 1,
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
                  <p>
                    Размер: {Math.round((draggedImage || userImage).width)}×
                    {Math.round((draggedImage || userImage).height)}px
                  </p>
                  <p>
                    Поворот: {Math.round((draggedImage || userImage).rotation)}°
                  </p>
                  <p>
                    Прозрачность:{" "}
                    {Math.round((draggedImage || userImage).opacity * 100)}%
                  </p>
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
