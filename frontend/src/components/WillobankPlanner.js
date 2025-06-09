import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check, AlertTriangle, TreePine, Droplets, Home, Users } from 'lucide-react';
import { requirementsApi } from '../services/api';

const WillowbankPlanner = () => {
  const [requirements, setRequirements] = useState({
    needs: [],
    wants: [],
    'nice-to-haves': []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('needs');

  // Load requirements on component mount
  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      const response = await requirementsApi.getAll();
      if (response.success) {
        setRequirements(response.data);
      }
    } catch (err) {
      setError('Failed to load requirements: ' + err.message);
      console.error('Failed to load requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.trim()) return;

    try {
      const response = await requirementsApi.create({
        category: selectedCategory,
        description: newItem.trim()
      });

      if (response.success) {
        // Update local state
        setRequirements(prev => ({
          ...prev,
          [selectedCategory]: [...prev[selectedCategory], response.data]
        }));
        setNewItem('');
      }
    } catch (err) {
      setError('Failed to add requirement: ' + err.message);
    }
  };

  const removeItem = async (category, requirementId) => {
    try {
      await requirementsApi.delete(requirementId);
      
      // Update local state
      setRequirements(prev => ({
        ...prev,
        [category]: prev[category].filter(item => item.id !== requirementId)
      }));
    } catch (err) {
      setError('Failed to remove requirement: ' + err.message);
    }
  };

  const phases = [
    {
      title: "Phase 1: Planning & Assessment (Months 1-2)",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "bg-red-50 border-red-200",
      tasks: [
        "Contact Jeff Anderson at Yolo County Planning (530) 666-8043",
        "Obtain specific Willowbank PD regulations and setback requirements", 
        "Verify property lines and easements",
        "Assess existing irrigation system coverage and condition",
        "Conduct soil test and drainage assessment",
        "Create base site map with existing conditions",
        "Develop water budget for MWELO compliance"
      ]
    },
    {
      title: "Phase 2: Infrastructure & Hardscape (Months 3-4)",
      icon: <Home className="w-6 h-6" />,
      color: "bg-blue-50 border-blue-200",
      tasks: [
        "Assess existing irrigation system and coverage",
        "Upgrade/expand irrigation zones for new plantings",
        "Build raised beds for vegetables/herbs/fruits",
        "Create pathways and define functional zones",
        "Install play area with proper setbacks",
        "Install landscape lighting if desired"
      ]
    },
    {
      title: "Phase 3: Plant Installation (Months 5-7)",
      icon: <TreePine className="w-6 h-6" />,
      color: "bg-green-50 border-green-200",
      tasks: [
        "Install privacy hedge along road (behind required setback)",
        "Plant native pollinator gardens",
        "Install drought-tolerant foundation plantings",
        "Create wildlife corridor plantings",
        "Add shade trees (if space allows with setbacks)",
        "Install groundcovers and mulch"
      ]
    },
    {
      title: "Phase 4: Final Details (Months 8-9)",
      icon: <Droplets className="w-6 h-6" />,
      color: "bg-purple-50 border-purple-200",
      tasks: [
        "Fine-tune existing irrigation system and scheduling",
        "Add finishing touches and seasonal plants",
        "Install wildlife features (bird houses, water features)",
        "Create maintenance schedule",
        "Document for MWELO Certificate of Completion",
        "Establish long-term care routine"
      ]
    }
  ];

  const complianceNotes = [
    "Front yard hedge: Max 3 feet within 4 feet of road, up to 6 feet behind 10-foot setback",
    "Water budget: 75% of plants must be drought-tolerant (WUCOLS factor ≤0.3)",
    "Mulch requirement: 3-inch minimum on all exposed soil",
    "Turf limitation: Maximum 25% of landscape area",
    "Compost: 4 cubic yards per 1,000 sq ft required"
  ];

  const plantRecommendations = {
    privacy: ["Ceanothus 'Ray Hartman'", "Heteromeles arbutifolia", "Quercus agrifolia"],
    pollinators: ["Lavandula stoechas", "Salvia 'May Night'", "Eschscholzia californica"],
    vegetables: ["Mediterranean herbs", "Drought-tolerant vegetables", "Fruit trees (if space)"],
    wildlife: ["Native grasses", "Berry-producing shrubs", "Oak trees (where setbacks allow)"]
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Willowbank Property Landscape Planner
        </h1>
        <p className="text-gray-600">
          27314 Willowbank Rd • Parcel 069150029 • 37,997 sq ft (0.87 acres) • ✅ Existing irrigation system
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 text-sm mt-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Requirements Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            NEEDS (Must Have)
          </h3>
          <ul className="space-y-2">
            {requirements.needs.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.description}</span>
                <button 
                  onClick={() => removeItem('needs', item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <TreePine className="w-5 h-5 mr-2" />
            WANTS (High Priority)
          </h3>
          <ul className="space-y-2">
            {requirements.wants.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.description}</span>
                <button 
                  onClick={() => removeItem('wants', item.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            NICE TO HAVES (Future)
          </h3>
          <ul className="space-y-2">
            {requirements['nice-to-haves'].map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.description}</span>
                <button 
                  onClick={() => removeItem('nice-to-haves', item.id)}
                  className="text-green-500 hover:text-green-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Add New Item */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Add New Requirement</h3>
        <div className="flex gap-3">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="needs">NEEDS</option>
            <option value="wants">WANTS</option>
            <option value="nice-to-haves">NICE TO HAVES</option>
          </select>
          <input 
            type="text" 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Enter new requirement..."
            className="flex-1 border rounded px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
          <button 
            onClick={addItem}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Implementation Phases */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Step-by-Step Implementation Plan</h2>
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div key={index} className={`rounded-lg border-2 ${phase.color} p-6`}>
              <div className="flex items-center mb-4">
                {phase.icon}
                <h3 className="text-xl font-semibold ml-3">{phase.title}</h3>
              </div>
              <ul className="grid md:grid-cols-2 gap-2">
                {phase.tasks.map((task, taskIndex) => (
                  <li key={taskIndex} className="flex items-start text-sm">
                    <Check className="w-4 h-4 mr-2 mt-1 text-green-600 flex-shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Notes */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          🚨 Yolo County Compliance Requirements
        </h3>
        <ul className="space-y-2">
          {complianceNotes.map((note, index) => (
            <li key={index} className="text-sm flex items-start">
              <AlertTriangle className="w-4 h-4 mr-2 mt-1 text-yellow-600 flex-shrink-0" />
              {note}
            </li>
          ))}
        </ul>
      </div>

      {/* Plant Recommendations */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(plantRecommendations).map(([category, plants]) => (
          <div key={category} className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold capitalize text-green-800 mb-2">{category}</h4>
            <ul className="text-sm space-y-1">
              {plants.map((plant, index) => (
                <li key={index} className="text-green-700">• {plant}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Budget Estimation */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Estimated Budget Ranges</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold">Phase 1: Planning</div>
            <div className="text-gray-600">$2,000 - $5,000</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold">Phase 2: Infrastructure</div>
            <div className="text-gray-600">$4,000 - $8,000</div>
            <div className="text-xs text-green-600">💰 Existing irrigation saves ~$3-5K</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold">Phase 3: Plants</div>
            <div className="text-gray-600">$5,000 - $12,000</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold">Phase 4: Finishing</div>
            <div className="text-gray-600">$2,000 - $5,000</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          *Total estimated: $13,000-$30,000 over 8-9 months. Existing irrigation saves significant time and cost!
        </p>
      </div>
    </div>
  );
};

export default WillowbankPlanner;
