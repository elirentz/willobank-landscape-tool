import React, { useState, useEffect } from 'react';
import { Search, Filter, Leaf, Star, TreePine, Grid, List } from 'lucide-react';
import PlantCard from './PlantCard';
import { plantsApi } from '../services/api';

const PlantSection = () => {
  const [plants, setPlants] = useState({});
  const [filteredPlants, setFilteredPlants] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState({
    waterNeeds: 'all',
    sunRequirements: 'all',
    native: false,
    droughtTolerant: false,
    recommended: false
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedPlants, setSelectedPlants] = useState([]);

  const categories = [
    { key: 'all', label: 'All Plants', icon: TreePine },
    { key: 'privacy', label: 'Privacy & Screening', icon: TreePine },
    { key: 'pollinators', label: 'Pollinators', icon: Leaf },
    { key: 'vegetables', label: 'Herbs & Vegetables', icon: Leaf },
    { key: 'wildlife', label: 'Wildlife Habitat', icon: Leaf },
    { key: 'trees', label: 'Trees', icon: TreePine },
    { key: 'groundcover', label: 'Groundcover', icon: Leaf }
  ];

  const waterOptions = [
    { key: 'all', label: 'All Water Needs' },
    { key: 'low', label: 'Low Water' },
    { key: 'moderate', label: 'Moderate Water' },
    { key: 'high', label: 'High Water' }
  ];

  const sunOptions = [
    { key: 'all', label: 'All Light Conditions' },
    { key: 'full-sun', label: 'Full Sun' },
    { key: 'partial-sun', label: 'Partial Sun' },
    { key: 'shade', label: 'Shade' }
  ];

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [plants, searchTerm, selectedCategory, filters]);

  const loadPlants = async () => {
    try {
      setLoading(true);
      const response = await plantsApi.getAll();
      if (response.success) {
        setPlants(response.data);
      }
    } catch (err) {
      setError('Failed to load plants: ' + err.message);
      console.error('Failed to load plants:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!plants || Object.keys(plants).length === 0) {
      setFilteredPlants({});
      return;
    }

    const filtered = {};
    const allPlants = Object.values(plants).flat();

    // Apply search filter
    let searchFiltered = allPlants;
    if (searchTerm) {
      searchFiltered = allPlants.filter(plant =>
        plant.common_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (plant.notes && plant.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      searchFiltered = searchFiltered.filter(plant => plant.category === selectedCategory);
    }

    // Apply other filters
    if (filters.waterNeeds !== 'all') {
      searchFiltered = searchFiltered.filter(plant => plant.water_needs === filters.waterNeeds);
    }
    if (filters.sunRequirements !== 'all') {
      searchFiltered = searchFiltered.filter(plant => plant.sun_requirements === filters.sunRequirements);
    }
    if (filters.native) {
      searchFiltered = searchFiltered.filter(plant => plant.native);
    }
    if (filters.droughtTolerant) {
      searchFiltered = searchFiltered.filter(plant => plant.drought_tolerant);
    }
    if (filters.recommended) {
      searchFiltered = searchFiltered.filter(plant => plant.recommended);
    }

    // Group filtered results by category
    const grouped = {
      privacy: searchFiltered.filter(p => p.category === 'privacy'),
      pollinators: searchFiltered.filter(p => p.category === 'pollinators'),
      vegetables: searchFiltered.filter(p => p.category === 'vegetables'),
      wildlife: searchFiltered.filter(p => p.category === 'wildlife'),
      trees: searchFiltered.filter(p => p.category === 'trees'),
      groundcover: searchFiltered.filter(p => p.category === 'groundcover')
    };

    setFilteredPlants(grouped);
  };

  const handlePlantSelect = (plant) => {
    setSelectedPlants(prev => {
      const isSelected = prev.find(p => p.id === plant.id);
      if (isSelected) {
        return prev.filter(p => p.id !== plant.id);
      } else {
        return [...prev, plant];
      }
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setFilters({
      waterNeeds: 'all',
      sunRequirements: 'all',
      native: false,
      droughtTolerant: false,
      recommended: false
    });
  };

  const getTotalPlantsCount = () => {
    return Object.values(filteredPlants).reduce((total, categoryPlants) => total + categoryPlants.length, 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <TreePine className="w-8 h-8 text-green-500 animate-pulse" />
          <span className="ml-2 text-lg text-gray-600">Loading plants...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800">{error}</div>
        <button 
          onClick={loadPlants}
          className="text-red-600 text-sm mt-2 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TreePine className="w-6 h-6 text-green-600" />
            Plant Database
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {getTotalPlantsCount()} plants
            </span>
            <div className="flex border border-gray-200 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search plants by name, scientific name, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.key
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Water Needs */}
            <select
              value={filters.waterNeeds}
              onChange={(e) => setFilters(prev => ({ ...prev, waterNeeds: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {waterOptions.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>

            {/* Sun Requirements */}
            <select
              value={filters.sunRequirements}
              onChange={(e) => setFilters(prev => ({ ...prev, sunRequirements: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              {sunOptions.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>

            {/* Boolean Filters */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.native}
                onChange={(e) => setFilters(prev => ({ ...prev, native: e.target.checked }))}
                className="rounded"
              />
              Native Plants
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.droughtTolerant}
                onChange={(e) => setFilters(prev => ({ ...prev, droughtTolerant: e.target.checked }))}
                className="rounded"
              />
              Drought Tolerant
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.recommended}
                onChange={(e) => setFilters(prev => ({ ...prev, recommended: e.target.checked }))}
                className="rounded"
              />
              UC Davis Recommended
            </label>

            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Selected Plants Summary */}
      {selectedPlants.length > 0 && (
        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {selectedPlants.length} plants selected for your landscape
            </span>
            <button
              onClick={() => setSelectedPlants([])}
              className="text-sm text-green-600 hover:text-green-800 ml-2"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Plants Grid/List */}
      <div className="p-6">
        {getTotalPlantsCount() === 0 ? (
          <div className="text-center py-12">
            <TreePine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No plants found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredPlants).map(([categoryKey, categoryPlants]) => {
              if (categoryPlants.length === 0) return null;
              
              const category = categories.find(c => c.key === categoryKey);
              const IconComponent = category?.icon || TreePine;
              
              return (
                <div key={categoryKey}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-green-600" />
                    {category?.label || categoryKey} ({categoryPlants.length})
                  </h3>
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                  }>
                    {categoryPlants.map(plant => (
                      <PlantCard
                        key={plant.id}
                        plant={plant}
                        onSelect={handlePlantSelect}
                        isSelected={selectedPlants.find(p => p.id === plant.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantSection;

