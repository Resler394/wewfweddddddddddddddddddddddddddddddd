export interface GoogleReviewItem {
  id: string;
  authorName: string;
  authorPhotoUri: string | null;
  authorUri: string | null;
  rating: number;
  text: string;
  relativePublishTimeDescription: string;
  publishTime: string | null;
  googleMapsUri: string | null;
}

export interface GoogleReviewsResponse {
  available: boolean;
  placeId: string;
  displayName: string;
  formattedAddress: string;
  rating: number;
  userRatingCount: number;
  googleMapsUri: string;
  reviews: GoogleReviewItem[];
  cached?: boolean;
  lastFetched?: string;
  message?: string;
}

let inMemoryReviewsPromise: Promise<GoogleReviewsResponse> | null = null;

export const fetchGoogleReviews = async (): Promise<GoogleReviewsResponse> => {
  if (inMemoryReviewsPromise) {
    return inMemoryReviewsPromise;
  }

  inMemoryReviewsPromise = (async () => {
    try {
      const res = await fetch('/api/google-reviews');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          available: false,
          placeId: 'ChIJA4-eLwCThRIROYpgW448oDM',
          displayName: 'VENTY THE COFFEE',
          formattedAddress: 'Soufay, RN14, Khemis Miliana 44003, Algeria',
          rating: 4.4,
          userRatingCount: 10,
          googleMapsUri: errorData.googleMapsUri || 'https://maps.google.com/?cid=3720039874324105785',
          reviews: [],
          message: errorData.message || 'Google reviews are temporarily unavailable.',
        };
      }
      return await res.json();
    } catch (err) {
      console.warn('[Google Reviews Client] Failed to fetch live Google Reviews:', err);
      return {
        available: false,
        placeId: 'ChIJA4-eLwCThRIROYpgW448oDM',
        displayName: 'VENTY THE COFFEE',
        formattedAddress: 'Soufay, RN14, Khemis Miliana 44003, Algeria',
        rating: 4.4,
        userRatingCount: 10,
        googleMapsUri: 'https://maps.google.com/?cid=3720039874324105785',
        reviews: [],
        message: 'Google reviews are temporarily unavailable.',
      };
    }
  })();

  return inMemoryReviewsPromise;
};
