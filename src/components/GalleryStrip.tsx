import React from 'react';
import { GALLERY_ITEMS } from '../data/coffeeData';

export const GalleryStrip: React.FC = () => {
  return (
    <section className="w-full bg-[#faf6ef] overflow-hidden py-0">
      <div className="grid grid-cols-2 md:grid-cols-5 w-full">
        {GALLERY_ITEMS.map((item, index) => (
          <div
            key={index}
            className={`relative h-[220px] sm:h-[260px] md:h-[280px] overflow-hidden bg-[#eee9de] ${
              index === 4 ? 'col-span-2 md:col-span-1' : ''
            }`}
          >
            <img
              src={item.image}
              alt={item.alt}
              title={item.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105 filter brightness-[0.96] hover:brightness-100"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </div>
    </section>
  );
};
