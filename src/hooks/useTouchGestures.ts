import { useEffect, useRef } from 'react';

interface TouchGestureOptions {
  onPinch?: (scale: number, centerX: number, centerY: number) => void;
  onRotate?: (rotation: number, centerX: number, centerY: number) => void;
  onDrag?: (deltaX: number, deltaY: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
}

export const useTouchGestures = (
  elementRef: React.RefObject<HTMLElement>,
  options: TouchGestureOptions
) => {
  const lastTouchTime = useRef(0);
  const lastTouchDistance = useRef(0);
  const lastTouchAngle = useRef(0);
  const initialTouchPositions = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getTouchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;

      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchAngle = (touches: TouchList) => {
      if (touches.length < 2) return 0;

      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.atan2(dy, dx) * 180 / Math.PI;
    };

    const getTouchCenter = (touches: TouchList) => {
      if (touches.length < 2) return { x: 0, y: 0 };

      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      const now = Date.now();
      const timeDiff = now - lastTouchTime.current;

      // Обработка двойного тапа
      if (e.touches.length === 1 && timeDiff < 300 && timeDiff > 0) {
        const touch = e.touches[0];
        options.onDoubleTap?.(touch.clientX, touch.clientY);
        return;
      }

      // Сохраняем начальные позиции для drag
      initialTouchPositions.current = Array.from(e.touches).map(touch => ({
        x: touch.clientX,
        y: touch.clientY
      }));

      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchAngle.current = getTouchAngle(e.touches);
      lastTouchTime.current = now;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && options.onDrag && initialTouchPositions.current.length === 1) {
        // Drag gesture
        const deltaX = e.touches[0].clientX - initialTouchPositions.current[0].x;
        const deltaY = e.touches[0].clientY - initialTouchPositions.current[0].y;

        options.onDrag(deltaX, deltaY);

        // Обновляем начальную позицию
        initialTouchPositions.current[0] = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2) {
        const currentDistance = getTouchDistance(e.touches);
        const currentAngle = getTouchAngle(e.touches);
        const center = getTouchCenter(e.touches);

        // Pinch gesture
        if (options.onPinch && lastTouchDistance.current > 0) {
          const scale = currentDistance / lastTouchDistance.current;
          options.onPinch(scale, center.x, center.y);
        }

        // Rotate gesture
        if (options.onRotate) {
          let rotation = currentAngle - lastTouchAngle.current;

          // Нормализуем угол
          while (rotation > 180) rotation -= 360;
          while (rotation < -180) rotation += 360;

          options.onRotate(rotation, center.x, center.y);
        }

        lastTouchDistance.current = currentDistance;
        lastTouchAngle.current = currentAngle;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 0 && options.onTap && initialTouchPositions.current.length === 1) {
        // Simple tap
        const touch = initialTouchPositions.current[0];
        options.onTap(touch.x, touch.y);
      }

      initialTouchPositions.current = [];
      lastTouchDistance.current = 0;
    };

    // Добавляем обработчики событий
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [elementRef, options]);
};