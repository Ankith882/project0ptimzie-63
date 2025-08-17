import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { COLOR_PICKER_COLORS } from '@/utils/colorConstants';

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  onApply?: () => void;
  onClose?: () => void;
  className?: string;
  isDarkMode?: boolean;
  customColor?: string;
  onCustomColorChange?: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor = '#00FF00',
  onColorSelect,
  onApply,
  onClose,
  className,
  isDarkMode = false,
  customColor: externalCustomColor,
  onCustomColorChange
}) => {
  const [customColor, setCustomColor] = useState(externalCustomColor || selectedColor);

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    if (onCustomColorChange) {
      onCustomColorChange(value);
    }
    if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
      onColorSelect(value);
    }
  };

  return (
    <div className={cn(
      "bg-white/30 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-lg w-64",
      className
    )}>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">Text Color</h3>
        
        {/* Color Grid */}
        <div className="flex flex-wrap gap-1">
          {COLOR_PICKER_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              className={cn(
                "w-6 h-6 rounded transition-all hover:scale-110",
                selectedColor === color ? "ring-2 ring-blue-500 ring-offset-1" : ""
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Custom Color Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-800">Custom Color</h4>
          
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
              style={{ backgroundColor: customColor }}
              onClick={() => document.getElementById('color-picker-input')?.click()}
              title="Click to open color picker"
            />
            <input
              id="color-picker-input"
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="hidden"
            />
            <Input
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 text-xs bg-white/50 border-gray-300 font-mono h-8"
              maxLength={7}
            />
            <Button
              size="sm"
              onClick={onApply}
              className="bg-gray-800 hover:bg-gray-900 text-white px-3 h-8 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};