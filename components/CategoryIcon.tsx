
import React from 'react';
import { 
  Wrench, Zap, Droplet, Hammer, Palette, Car, 
  Home, Smartphone, Search, Scissors, Truck, 
  Thermometer, Camera, Briefcase, Key, Star 
} from 'lucide-react';

interface CategoryIconProps {
  iconName?: string;
  size?: number;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, size = 24, className = '' }) => {
  const normalizedName = iconName?.toLowerCase().trim() || 'wrench';

  const icons: Record<string, React.ElementType> = {
    wrench: Wrench,
    electrician: Zap,
    zap: Zap,
    plumber: Droplet,
    droplet: Droplet,
    water: Droplet,
    carpenter: Hammer,
    hammer: Hammer,
    painter: Palette,
    palette: Palette,
    mechanic: Car,
    car: Car,
    cleaning: Home,
    home: Home,
    appliance: Smartphone,
    smartphone: Smartphone,
    inspection: Search,
    search: Search,
    salon: Scissors,
    scissors: Scissors,
    mover: Truck,
    truck: Truck,
    ac: Thermometer,
    thermometer: Thermometer,
    camera: Camera,
    photography: Camera,
    business: Briefcase,
    locksmith: Key,
    key: Key
  };

  const IconComponent = icons[normalizedName] || icons[Object.keys(icons).find(k => normalizedName.includes(k)) || ''] || Wrench;

  return <IconComponent size={size} className={className} />;
};

export default CategoryIcon;
