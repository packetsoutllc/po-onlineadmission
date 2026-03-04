import React from 'react';
import { ServiceCategory } from '../types';

interface ServiceCardProps {
  service: ServiceCategory;
  onSelect: (service: ServiceCategory) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
  const Icon = service.icon;
  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200/80 dark:border-transparent dark:shadow-lg dark:hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col overflow-hidden"
    >
      <div className="p-8 flex-grow">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
          <Icon className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
        <p className="text-gray-600 text-base leading-relaxed">{service.description}</p>
      </div>
      <div className="bg-gray-50 p-6">
        <button
          onClick={() => onSelect(service)}
          className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;