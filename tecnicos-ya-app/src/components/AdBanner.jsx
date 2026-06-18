import React from 'react';

export default function AdBanner({ type, image, text, link, ctaText }) {
  // Estilos según el tipo de banner
  const styles = {
    promo: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
    external: 'bg-gray-100 text-gray-800 border border-gray-200',
    premium: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
  };

  const currentStyle = styles[type] || styles.external;

  return (
    <div className={`relative overflow-hidden rounded-xl p-4 mb-6 shadow-sm transition-transform hover:scale-[1.01] cursor-pointer ${currentStyle}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {image && (
            <img src={image} alt="Ad" className="w-16 h-16 rounded-lg object-cover shadow-md" />
          )}
          <div>
            <p className="font-bold text-lg leading-tight">{text}</p>
            <p className="text-sm opacity-90">Haz clic para saber más</p>
          </div>
        </div>
        {ctaText && (
          <a 
            href={link} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              type === 'external' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
