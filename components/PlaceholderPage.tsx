
import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px]">
      <div className="w-16 h-16 rounded-full bg-logip-primary/10 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-4xl text-logip-primary">
              pending
          </span>
      </div>
      <h2 className="text-2xl font-bold text-logip-text-header dark:text-gray-100">
          {title}
      </h2>
      <p className="mt-2 text-base text-logip-text-body dark:text-gray-400 max-w-md">
          This section is currently under construction. Please check back later for updates.
      </p>
    </div>
  );
};

export default PlaceholderPage;