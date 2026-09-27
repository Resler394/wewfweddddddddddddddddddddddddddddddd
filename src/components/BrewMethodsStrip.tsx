import React from 'react';
import { motion } from 'motion/react';
import { Coffee, Droplets, Sparkles, Clock } from 'lucide-react';

export const BrewMethodsStrip: React.FC = () => {
  const methods = [
    {
      id: 'specialty-coffee',
      name: 'SPECIALTY COFFEE',
      desc: 'Carefully prepared coffee experiences',
      icon: Coffee,
    },
    {
      id: 'fresh-juices',
      name: 'FRESH JUICES',
      desc: 'Refreshing drinks made for every visit',
      icon: Droplets,
    },
    {
      id: 'sweet-moments',
      name: 'SWEET MOMENTS',
      desc: 'A curated selection of desserts and treats',
      icon: Sparkles,
    },
    {
      id: 'daily-vibes',
      name: 'DAILY VIBES',
      desc: 'Welcoming space to enjoy and connect',
      icon: Clock,
    },
  ];

  return (
    <section className="w-full bg-[#c9833a]/15 border-y border-[#c9833a]/20 py-12 md:py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {methods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, x: -25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: index * 0.1, ease: 'easeOut' }}
                className="flex flex-col items-center text-center group"
              >
                <div className="mb-3 text-[#6b3a1f] transition-transform duration-300 group-hover:scale-110">
                  <Icon className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h4 className="font-sans font-medium text-[11px] md:text-xs tracking-[0.16em] uppercase text-[#381c10] mb-1">
                  {method.name}
                </h4>
                <p className="font-serif italic text-xs md:text-sm text-[#59493f]">
                  {method.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
