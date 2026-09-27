import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star, ExternalLink, MessageSquare, ShieldCheck, Info } from 'lucide-react';
import { fetchGoogleReviews, GoogleReviewsResponse } from '../services/googleReviewsApi';

export const TestimonialsSection: React.FC = () => {
  const [data, setData] = useState<GoogleReviewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetchGoogleReviews()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
          if (!res.available && (!res.reviews || res.reviews.length === 0)) {
            setError(true);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const ratingValue = data?.rating ? data.rating.toFixed(1) : '4.4';
  const countValue = data?.userRatingCount ?? 10;
  const mapsUri = data?.googleMapsUri || 'https://maps.google.com/?cid=3720039874324105785';
  const reviewsList = data?.reviews?.filter((r) => r.text && r.text.trim().length > 0) || [];

  return (
    <section className="w-full bg-[#faf6ef] py-20 md:py-28 px-6 md:px-10 border-t border-[#ded7c8]/50" aria-label="Google Reviews">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-2.5 px-3.5 py-1.5 rounded-full bg-[#eee9de] border border-[#ded7c8]/80 text-[#2b1d16] shadow-sm">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-sans font-semibold text-xs tracking-wide text-[#2b1d16]">
              Google Reviews
            </span>
            <span className="text-[#8a7b70] text-xs">·</span>
            <span className="font-sans font-bold text-xs text-[#c9833a]">
              {ratingValue} ★
            </span>
            <span className="font-sans text-[11px] text-[#8a7b70]">
              ({countValue} Google Ratings)
            </span>
          </div>

          <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#221a14] tracking-tight">
            Customer Voices
          </h2>
          <p className="font-sans text-xs md:text-sm text-[#8a7b70] mt-2 max-w-lg mx-auto">
            Featured feedback directly from our Google Maps community in Miliana.
          </p>

          <div className="flex justify-center mt-3.5">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-12 h-[2px] bg-[#c9833a]"
            />
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#eee9de] p-8 md:p-9 flex flex-col justify-between border border-[#ded7c8]/60 animate-pulse min-h-[240px]"
              >
                <div>
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-3.5 h-3.5 bg-[#ded7c8] rounded" />
                    ))}
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-[#ded7c8] rounded w-full" />
                    <div className="h-4 bg-[#ded7c8] rounded w-5/6" />
                    <div className="h-4 bg-[#ded7c8] rounded w-3/4" />
                  </div>
                </div>
                <div className="pt-4 border-t border-[#ded7c8]/60 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#ded7c8]" />
                  <div className="h-3 bg-[#ded7c8] rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error / Fallback State */}
        {!loading && error && reviewsList.length === 0 && (
          <div className="bg-[#eee9de] p-8 md:p-12 text-center border border-[#ded7c8]/60 max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#faf6ef] flex items-center justify-center mx-auto mb-4 text-[#c9833a]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-[#2b1d16] mb-2">
              Google Reviews Temporarily Unavailable
            </h3>
            <p className="font-sans text-sm text-[#8a7b70] mb-6">
              You can explore our full rating ({ratingValue} ★ from {countValue} reviews) and read authentic customer feedback directly on Google Maps.
            </p>
            <a
              href={mapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2b1d16] text-[#faf6ef] font-sans font-medium text-xs uppercase tracking-[0.14em] transition-colors hover:bg-[#c9833a]"
            >
              <span>View us on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Real Google Review Cards */}
        {!loading && reviewsList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {reviewsList.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#eee9de] p-8 md:p-9 flex flex-col justify-between border border-[#ded7c8]/60 shadow-[0_2px_8px_rgba(43,29,22,0.02)] transition-transform duration-300 hover:-translate-y-1 relative"
              >
                <div>
                  {/* Rating Stars & Access Disclosure */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="flex items-center gap-1 text-[#c9833a]"
                      aria-label={`Rated ${item.rating} out of 5 stars on Google`}
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < item.rating
                              ? 'fill-[#c9833a] text-[#c9833a]'
                              : 'text-[#ded7c8] fill-[#ded7c8]/40'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="font-sans text-[10px] text-[#8a7b70] uppercase tracking-wider">
                      Google Review
                    </span>
                  </div>

                  {/* Authentic Review Text */}
                  <blockquote className="font-serif italic text-base md:text-lg text-[#2b1d16] leading-relaxed mb-6">
                    "{item.text}"
                  </blockquote>
                </div>

                {/* Author Info & Direct Google Maps Review Link */}
                <div className="pt-4 border-t border-[#ded7c8]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.authorPhotoUri ? (
                      <img
                        src={item.authorPhotoUri}
                        alt={`${item.authorName}'s avatar`}
                        className="w-7 h-7 rounded-full object-cover border border-[#ded7c8] flex-shrink-0"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#ded7c8] flex items-center justify-center font-sans font-bold text-[11px] text-[#2b1d16] flex-shrink-0">
                        {item.authorName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      {item.authorUri ? (
                        <a
                          href={item.authorUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-sans font-medium uppercase text-[10px] tracking-[0.14em] text-[#2b1d16] hover:text-[#c9833a] transition-colors truncate block"
                          title={`View ${item.authorName}'s Google Maps profile`}
                        >
                          {item.authorName}
                        </a>
                      ) : (
                        <p className="font-sans font-medium uppercase text-[10px] tracking-[0.14em] text-[#2b1d16] truncate">
                          {item.authorName}
                        </p>
                      )}
                      <p className="font-sans text-[9px] text-[#8a7b70] tracking-[0.05em]">
                        {item.relativePublishTimeDescription}
                      </p>
                    </div>
                  </div>

                  {/* Direct Link to Specific Review on Google Maps */}
                  <a
                    href={item.googleMapsUri || mapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-sans text-[#8a7b70] hover:text-[#c9833a] transition-colors flex-shrink-0 ml-2 py-1 px-1.5 rounded hover:bg-[#faf6ef]"
                    aria-label={`View ${item.authorName}'s review directly on Google Maps`}
                    title="View this review on Google Maps"
                  >
                    <span className="hidden sm:inline">View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Ordering, Authenticity Disclosures & Google Attribution */}
        {!loading && (
          <div className="mt-12 space-y-4">
            <div className="text-center">
              <a
                href={mapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2b1d16] text-[#faf6ef] font-sans font-medium text-xs uppercase tracking-[0.14em] transition-colors hover:bg-[#c9833a]"
              >
                <span>See all {countValue} reviews on Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Compliance Disclosures */}
            <div className="max-w-2xl mx-auto pt-4 border-t border-[#ded7c8]/60 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8a7b70] font-sans">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google Places Reviews · Powered by Google Maps</span>
              </div>
              <p className="text-[10px] text-[#8a7b70] font-sans leading-normal">
                Reviews are displayed according to Google's ranking & ordering. User-generated content from Google Maps contributors, presented unedited in original language.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

