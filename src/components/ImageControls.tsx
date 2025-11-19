import React from 'react';
import type { UserImage } from '../types';
import { Slider } from './ui/Slider';
import { IconButton } from './ui/IconButton';
import { Upload, RotateCw, Move, Trash2 } from 'lucide-react';

interface ImageControlsProps {
  image: UserImage;
  onChange: (updates: Partial<UserImage>) => void;
  onUploadNew: () => void;
}

export const ImageControls = ({
  image,
  onChange,
  onUploadNew
}) => {
  const handleSizeChange = (factor: number) => {
    const newWidth = image.width * factor;
    const newHeight = image.height * factor;

    onChange({
      width: Math.max(20, Math.min(500, newWidth)),
      height: Math.max(20, Math.min(500, newHeight))
    });
  };

  const handleRotate = (degrees: number) => {
    onChange({
      rotation: (image.rotation + degrees) % 360
    });
  };

  const handleReset = () => {
    onChange({
      rotation: 0,
      opacity: 1,
      width: image.width,
      height: image.height
    });
  };

  const handleDelete = () => {
    onChange({
      id: '',
      src: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      opacity: 0
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {/* Size Controls */}
          <IconButton
            onClick={() => handleSizeChange(1.1)}
            className="bg-blue-100 hover:bg-blue-200"
          >
            <span className="text-blue-600 font-bold text-lg">+</span>
          </IconButton>
          <IconButton
            onClick={() => handleSizeChange(0.9)}
            className="bg-blue-100 hover:bg-blue-200"
          >
            <span className="text-blue-600 font-bold text-lg">−</span>
          </IconButton>

          {/* Rotate Controls */}
          <IconButton
            onClick={() => handleRotate(-15)}
            className="bg-purple-100 hover:bg-purple-200"
          >
            <RotateCw size={20} className="text-purple-600 transform rotate-180" />
          </IconButton>
          <IconButton
            onClick={() => handleRotate(15)}
            className="bg-purple-100 hover:bg-purple-200"
          >
            <RotateCw size={20} className="text-purple-600" />
          </IconButton>

          {/* Reset */}
          <IconButton
            onClick={handleReset}
            className="bg-gray-100 hover:bg-gray-200"
          >
            <Move size={20} className="text-gray-600" />
          </IconButton>
        </div>

        <div className="flex space-x-2">
          {/* Upload New */}
          <IconButton
            onClick={onUploadNew}
            className="bg-green-100 hover:bg-green-200"
          >
            <Upload size={20} className="text-green-600" />
          </IconButton>

          {/* Delete */}
          <IconButton
            onClick={handleDelete}
            className="bg-red-100 hover:bg-red-200"
          >
            <Trash2 size={20} className="text-red-600" />
          </IconButton>
        </div>
      </div>

      {/* Precision Controls */}
      <div className="space-y-3 border-t pt-4">
        {/* Opacity Slider */}
        <Slider
          label="Прозрачность"
          value={image.opacity * 100}
          onChange={(value) => onChange({ opacity: value / 100 })}
          min={0}
          max={100}
          step={5}
        />

        {/* Size Slider */}
        <div className="grid grid-cols-2 gap-4">
          <Slider
            label="Ширина"
            value={image.width}
            onChange={(value) => onChange({ width: value })}
            min={20}
            max={300}
            step={5}
          />
          <Slider
            label="Высота"
            value={image.height}
            onChange={(value) => onChange({ height: value })}
            min={20}
            max={300}
            step={5}
          />
        </div>

        {/* Rotation Slider */}
        <Slider
          label="Поворот"
          value={image.rotation}
          onChange={(value) => onChange({ rotation: value })}
          min={-180}
          max={180}
          step={5}
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 Совет: Используйте пальцы для перемещения и масштабирования изображения на холсте
        </p>
      </div>
    </div>
  );
};