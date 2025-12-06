import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // Current rating (0-5)
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  readonly = false,
  size = 20,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    if (!readonly) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!readonly) setHoverRating(null);
  };

  const handleClick = (index: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(index);
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, i) => {
        const index = i + 1;
        const isFilled = (hoverRating !== null ? hoverRating : rating) >= index;
        const isHalf = !isFilled && (hoverRating === null && rating >= index - 0.5); // Simple half-star logic if needed later

        return (
          <button
            key={index}
            type="button"
            className={`transition-transform ${!readonly ? 'hover:scale-110 focus:outline-none' : 'cursor-default'}`}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
            disabled={readonly}
          >
            <Star
              size={size}
              className={`${
                isFilled
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              } transition-colors duration-200`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;