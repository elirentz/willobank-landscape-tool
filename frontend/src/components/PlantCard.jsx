import React, { useState } from 'react';
import { 
  Droplets, Sun, Leaf, Star, TreePine, Palette, 
  Calendar, Ruler, Info, Heart, Award 
} from 'lucide-react';

const PlantCard = ({ plant, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getWaterIcon = (waterNeeds) => {
    switch (waterNeeds) {
      case 'low': return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'moderate': return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'high': return <Droplets className="w-4 h-4 text-blue-800" />;
      default: return <Droplets className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSunIcon = (sunRequirements) => {
    switch (sunRequirements) {
      case 'full-sun': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'partial-sun': return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'shade': return <Sun className="w-4 h-4 text-gray-400" />;
      default: return <Sun className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      privacy: 'bg-blue-100 text-blue-800',
      pollinators: 'bg-purple-100 text-purple-800',
      vegetables: 'bg-green-100 text-green-800',
      wildlife: 'bg-orange-100 text-orange-800',
      trees: 'bg-emerald-100 text-emerald-800',
      groundcover: 'bg-amber-100 text-amber-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatSunRequirement = (sunReq) => {
    const formats = {
      'full-sun': 'Full Sun',
      'partial-sun': 'Partial Sun',
      'shade': 'Shade'
    };
    return formats[sunReq] || sunReq;
  };

  const formatWaterNeeds = (water) => {
    const formats = {
      'low': 'Low Water',
      'moderate': 'Moderate Water',
      'high': 'High Water'
    };
    return formats[water] || water;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        {plant.image_url && !imageError ? (
          <img
            src={plant.image_url}
            alt={plant.common_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <TreePine className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(plant.category)}`}>
            {plant.category.replace('-', ' ')}
          </span>
          {plant.native && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Native
            </span>
          )}
          {plant.recommended && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
              <Award className="w-3 h-3" />
              UC Davis
            </span>
          )}
        </div>

        {/* Favorite/Select Button */}
        <button
          onClick={() => onSelect && onSelect(plant)}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Plant Names */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {plant.common_name}
          </h3>
          {plant.scientific_name && (
            <p className="text-sm text-gray-500 italic mt-1">
              {plant.scientific_name}
            </p>
          )}
        </div>

        {/* Quick Info Icons */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-1" title={formatWaterNeeds(plant.water_needs)}>
            {getWaterIcon(plant.water_needs)}
            <span className="text-gray-600">{formatWaterNeeds(plant.water_needs)}</span>
          </div>
          <div className="flex items-center gap-1" title={formatSunRequirement(plant.sun_requirements)}>
            {getSunIcon(plant.sun_requirements)}
            <span className="text-gray-600">{formatSunRequirement(plant.sun_requirements)}</span>
          </div>
        </div>

        {/* Key Details */}
        <div className="space-y-2 mb-3">
          {plant.mature_size && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Ruler className="w-4 h-4" />
              <span>{plant.mature_size}</span>
            </div>
          )}
          {plant.bloom_time && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Blooms: {plant.bloom_time}</span>
            </div>
          )}
          {plant.bloom_color && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Palette className="w-4 h-4" />
              <span>{plant.bloom_color}</span>
            </div>
          )}
        </div>

        {/* Wildlife Value */}
        {plant.wildlife_value && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Wildlife Value</span>
            </div>
            <p className="text-xs text-gray-600 pl-6">{plant.wildlife_value}</p>
          </div>
        )}

        {/* Drought Tolerant Badge */}
        {plant.drought_tolerant && (
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              🌵 Drought Tolerant
            </div>
          </div>
        )}

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <Info className="w-4 h-4" />
          {showDetails ? 'Hide Details' : 'More Details'}
        </button>

        {/* Detailed Information (Expandable) */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {plant.water_description && (
              <div>
                <h4 className="font-medium text-gray-800 mb-1 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Watering Guide
                </h4>
                <p className="text-sm text-gray-600">{plant.water_description}</p>
              </div>
            )}

            {plant.sun_description && (
              <div>
                <h4 className="font-medium text-gray-800 mb-1 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  Light Requirements
                </h4>
                <p className="text-sm text-gray-600">{plant.sun_description}</p>
              </div>
            )}

            {plant.care_instructions && (
              <div>
                <h4 className="font-medium text-gray-800 mb-1 flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-green-500" />
                  Care Instructions
                </h4>
                <p className="text-sm text-gray-600">{plant.care_instructions}</p>
              </div>
            )}

            {plant.hardiness_zone && (
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Hardiness Zone</h4>
                <p className="text-sm text-gray-600">USDA Zones {plant.hardiness_zone}</p>
              </div>
            )}

            {plant.notes && (
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Additional Notes</h4>
                <p className="text-sm text-gray-600">{plant.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantCard;
