import { useCallback } from 'react';
import type { MerchTemplate, UserImage } from '../types';

interface ExportOptions {
  format: 'png' | 'jpeg';
  quality?: number; // 0.1 - 1.0 (только для jpeg)
  pixelRatio?: number; // Для повышения качества
  backgroundColor?: string;
}

export const useImageExport = () => {
  const exportCanvas = useCallback((
    stage: any,
    template: MerchTemplate,
    _userImage: UserImage | null,
    options: ExportOptions = { format: 'png' }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!stage) {
          reject(new Error('Stage reference is required'));
          return;
        }

        const {
          format = 'png',
          quality = 0.9,
          pixelRatio = 2,
          backgroundColor = '#ffffff'
        } = options;

        // Создаем временный stage для экспорта без UI элементов
        const exportStage = stage.clone();

        // Удаляем все вспомогательные элементы (transformer, guides)
        exportStage.find('Transformer').forEach((node: any) => node.destroy());

        // Добавляем белый фон если нужно
        if (format === 'jpeg' || backgroundColor) {
          exportStage.find('Layer').forEach((layer: any) => {
            // Вставляем белый фон первым слоем
            const backgroundRect = new (window as any).Konva.Rect({
              x: 0,
              y: 0,
              width: template.canvasWidth,
              height: template.canvasHeight,
              fill: backgroundColor,
              listening: false
            });
            layer.getChildren().unshift(backgroundRect);
          });
        }

        // Экспортируем в DataURL
        const dataURL = exportStage.toDataURL({
          mimeType: `image/${format}`,
          quality: quality,
          pixelRatio: pixelRatio
        });

        // Очищаем временный stage
        exportStage.destroy();

        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const downloadImage = useCallback((
    dataURL: string,
    filename: string
  ) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const generateFilename = useCallback((
    template: MerchTemplate,
    format: string
  ) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
    return `merch-${template.name}-${timestamp}.${format}`;
  }, []);

  const exportAndDownload = useCallback(async (
    stage: any,
    template: MerchTemplate,
    userImage: UserImage | null,
    options: ExportOptions = { format: 'png' }
  ) => {
    try {
      const dataURL = await exportCanvas(stage, template, userImage, options);
      const filename = generateFilename(template, options.format);
      downloadImage(dataURL, filename);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [exportCanvas, generateFilename, downloadImage]);

  return {
    exportCanvas,
    downloadImage,
    generateFilename,
    exportAndDownload
  };
};