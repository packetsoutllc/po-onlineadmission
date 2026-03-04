import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import { School } from '../types';

interface SchoolCardProps {
  school: School;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ school }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col h-full group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={school.image} 
          alt={school.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-800 shadow-sm">
          {school.type}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{school.name}</h3>
          <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-700 text-xs font-medium">
            <Star className="w-3 h-3 fill-current" />
            {school.rating}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
          <MapPin className="w-3.5 h-3.5" />
          {school.location}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">{school.curriculum}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">{school.grades}</span>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
          {school.description}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
                {school.tuition === 0 ? 'Free / Public' : `$${school.tuition.toLocaleString()}/yr`}
            </div>
            <Link 
                to={`/school/${school.id}`}
                className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
                Details <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolCard;