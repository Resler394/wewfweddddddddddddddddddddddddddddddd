import defaultLogoAsset from '../assets/images/logo.png';
import heroImg from '../assets/images/regenerated_image_1790448398622.png';
import latteArtImg from '../assets/images/menu_latte_art_1790335455563.jpg';
import v60Img from '../assets/images/menu_v60_filter_1790335465755.jpg';
import oreoCheesecakeImg from '../assets/images/regenerated_image_1790448428225.png';
import juicesImg from '../assets/images/venty_fresh_juices_1790355062682.jpg';
import coffeeMomentsImg from '../assets/images/venty_coffee_moments_1790355076056.jpg';
import icedSpecialtyImg from '../assets/images/venty_iced_specialty_1790355101617.jpg';
import beansSackImg from '../assets/images/regenerated_image_1790389990211.jpg';
import baristaImg from '../assets/images/regenerated_image_1790385503773.png';
import cafeCornerImg from '../assets/images/regenerated_image_1790337393107.jpg';
import founderImg from '../assets/images/regenerated_image_1790336683505.png';

import { MenuItem, CoffeeBean, Testimonial } from '../types/coffee';

export const logoImage = defaultLogoAsset;

export const IMAGES = {
  logo: logoImage,
  hero: heroImg,
  latteArt: latteArtImg,
  v60: v60Img,
  oreoCheesecake: oreoCheesecakeImg,
  juices: juicesImg,
  coffeeMoments: coffeeMomentsImg,
  icedSpecialty: icedSpecialtyImg,
  beansSack: beansSackImg,
  barista: baristaImg,
  cafeCorner: cafeCornerImg,
  founder: founderImg,
};

export const MENU_HIGHLIGHTS = [
  {
    id: 'specialty-coffee',
    title: 'Specialty Coffee',
    startingPrice: 'Espresso & Filter',
    description: 'Single-origin espresso, silky flat whites, V60 pour-overs, and iced coffees crafted with care.',
    image: latteArtImg,
    categoryKey: 'espresso',
  },
  {
    id: 'fresh-juices',
    title: 'Fresh Juices',
    startingPrice: 'Seasonal Fruits',
    description: 'Refreshing freshly squeezed citrus juices, vibrant fruit coolers, and iced refreshments.',
    image: juicesImg,
    categoryKey: 'juice',
  },
  {
    id: 'sweets-desserts',
    title: 'Sweets & Treats',
    startingPrice: 'Artisanal Desserts',
    description: 'Signature Oreo cheesecake, delicate pastries, and rich chocolate desserts made for sweet moments.',
    image: oreoCheesecakeImg,
    categoryKey: 'sweets',
  },
  {
    id: 'coffee-moments',
    title: 'Coffee Moments',
    startingPrice: 'Miliana Vibes',
    description: 'A relaxed, contemporary social space to connect, unwind, and enjoy good vibes daily from 17:00 to 1:00.',
    image: coffeeMomentsImg,
    categoryKey: 'moments',
  },
];

export const BREW_METHODS = [
  {
    id: 'specialty-coffee',
    name: 'SPECIALTY COFFEE',
    descriptor: 'Carefully prepared coffee experiences',
    iconType: 'coffee',
    detail: 'Rich espresso, silky milk drinks, and precision filter extractions with single-origin beans.',
  },
  {
    id: 'fresh-juices',
    name: 'FRESH JUICES',
    descriptor: 'Refreshing drinks made for every visit',
    iconType: 'droplet',
    detail: 'Cold-pressed seasonal fruit juices and refreshing coolers crafted to order.',
  },
  {
    id: 'sweet-moments',
    name: 'SWEET MOMENTS',
    descriptor: 'A curated selection of desserts and treats',
    iconType: 'sparkles',
    detail: 'Handcrafted cakes, Oreo cheesecake, and pastries to pair with your favorite brew.',
  },
  {
    id: 'daily-vibes',
    name: 'DAILY VIBES',
    descriptor: 'Welcoming space to enjoy, relax and connect',
    iconType: 'clock',
    detail: 'Open daily from 17:00 to 1:00 in Miliana for your evening coffee and social gatherings.',
  },
];

export const COFFEE_BEANS: CoffeeBean[] = [
  {
    id: 'ethiopia-specialty',
    name: 'Single Origin Ethiopia',
    origin: 'Ethiopia',
    region: 'Yirgacheffe',
    process: 'Washed / African Raised Beds',
    altitude: '1,950m - 2,100m',
    notes: ['Bergamot', 'Jasmine', 'Stone Fruit', 'Honey Sweetness'],
    roastProfile: 'Filter Roast',
    price250g: 1400,
    formattedPrice: '1,400 DZD',
    description: 'High-altitude Ethiopian lot with delicate floral bouquet, sparkling citrus acidity, and a tea-like finish.',
  },
  {
    id: 'colombia-specialty',
    name: 'Colombia Huila Supremo',
    origin: 'Colombia',
    region: 'Huila Region',
    process: 'Fully Washed',
    altitude: '1,750m',
    notes: ['Caramel', 'Milk Chocolate', 'Red Apple', 'Toffee'],
    roastProfile: 'Medium-Light',
    price250g: 1350,
    formattedPrice: '1,350 DZD',
    description: 'Smooth, balanced, and round-bodied. Perfect for rich milk drinks and sweet morning espresso extractions.',
  },
  {
    id: 'house-blend-venty',
    name: 'Venty Signature Roast',
    origin: 'Central & South America',
    region: 'Specialty Blend',
    process: 'Washed & Natural Lots',
    altitude: '1,600m',
    notes: ['Dark Cocoa', 'Hazelnut', 'Brown Sugar'],
    roastProfile: 'Medium-Light',
    price250g: 1200,
    formattedPrice: '1,200 DZD',
    description: 'Our signature house coffee profile: bold, syrupy chocolate notes with a comforting caramel finish.',
  },
];

export const FULL_MENU_ITEMS: MenuItem[] = [
  // Specialty Coffee - Espresso & Milk
  {
    id: 'espresso-single-origin',
    name: 'Specialty Espresso',
    category: 'espresso',
    price: 350,
    formattedPrice: '350 DZD',
    description: 'Double shot of single-origin coffee with balanced crema and rich chocolate-berry notes.',
    tastingNotes: ['Dark Cocoa', 'Caramel', 'Stone Fruit'],
    image: latteArtImg,
  },
  {
    id: 'flat-white-venty',
    name: 'Flat White',
    category: 'espresso',
    price: 450,
    formattedPrice: '450 DZD',
    description: 'Velvety micro-foamed milk poured precisely over a double shot of rich espresso.',
    tastingNotes: ['Velvety', 'Sweet Milk', 'Nutty'],
    image: latteArtImg,
  },
  {
    id: 'caffe-latte-venty',
    name: 'Caffè Latte',
    category: 'espresso',
    price: 450,
    formattedPrice: '450 DZD',
    description: 'Silky espresso with gentle steamed milk and artisan latte art.',
    tastingNotes: ['Smooth', 'Creamy', 'Mild'],
    image: latteArtImg,
  },
  {
    id: 'iced-specialty-latte',
    name: 'Iced Specialty Latte',
    category: 'cold',
    price: 500,
    formattedPrice: '500 DZD',
    description: 'Chilled milk and double espresso poured over crystal ice blocks. Refreshing and smooth.',
    tastingNotes: ['Chilled', 'Bold Espresso', 'Sweet Cream'],
    image: icedSpecialtyImg,
  },
  {
    id: 'v60-pourover',
    name: 'V60 Hand Pour Filter',
    category: 'filter',
    price: 550,
    formattedPrice: '550 DZD',
    description: 'Single-origin filter coffee freshly hand-brewed to order highlighting floral and fruit notes.',
    tastingNotes: ['Bright', 'Floral', 'Clean Body'],
    image: v60Img,
  },
  {
    id: 'cold-brew-venty',
    name: 'Slow Chilled Cold Brew',
    category: 'cold',
    price: 500,
    formattedPrice: '500 DZD',
    description: 'Slow steeped for 16 hours for natural sweetness, low acidity, and deep cocoa finish.',
    tastingNotes: ['Cocoa Nib', 'Caramel', 'Crisp'],
    image: icedSpecialtyImg,
  },

  // Fresh Juices
  {
    id: 'fresh-orange-juice',
    name: 'Freshly Squeezed Orange Juice',
    category: 'juice',
    price: 400,
    formattedPrice: '400 DZD',
    description: '100% natural, freshly squeezed to order from sweet sun-ripened citrus fruits.',
    tastingNotes: ['Sweet Citrus', '100% Pure', 'Vitamin C'],
    image: juicesImg,
  },
  {
    id: 'citrus-mint-cooler',
    name: 'Lemon Mint Refresher',
    category: 'juice',
    price: 450,
    formattedPrice: '450 DZD',
    description: 'Zesty fresh lemon juice infused with crushed garden mint leaves over crushed ice.',
    tastingNotes: ['Zesty', 'Crushed Mint', 'Cooling'],
    image: juicesImg,
  },
  {
    id: 'mixed-berry-juice',
    name: 'Wild Berry Fruit Blend',
    category: 'juice',
    price: 500,
    formattedPrice: '500 DZD',
    description: 'Rich artisanal blend of berries and seasonal fruits served iced and refreshing.',
    tastingNotes: ['Berry Burst', 'Naturally Sweet', 'Rich Color'],
    image: juicesImg,
  },

  // Sweets & Desserts
  {
    id: 'oreo-cheesecake-slice',
    name: 'Signature Oreo Cheesecake',
    category: 'sweets',
    price: 600,
    formattedPrice: '600 DZD',
    description: 'Our iconic creamy cheesecake with chocolate Oreo cookie crumb crust and crushed biscuit topping.',
    tastingNotes: ['Creamy Vanilla', 'Crunchy Oreo', 'Decadent'],
    dietary: ['Vegetarian', 'Signature Item'],
    image: oreoCheesecakeImg,
  },
  {
    id: 'chocolate-fondant-cake',
    name: 'Artisan Chocolate Cake',
    category: 'sweets',
    price: 550,
    formattedPrice: '550 DZD',
    description: 'Rich layered chocolate cake with dark ganache, paired beautifully with a hot flat white.',
    tastingNotes: ['Dark Chocolate', 'Moist Sponge', 'Indulgent'],
    dietary: ['Vegetarian'],
    image: oreoCheesecakeImg,
  },
  {
    id: 'fresh-pastries-selection',
    name: 'Fresh Bakery Pastry',
    category: 'sweets',
    price: 350,
    formattedPrice: '350 DZD',
    description: 'Flaky golden viennoiserie and sweet morning treats made fresh daily.',
    tastingNotes: ['Flaky', 'Butter Layers', 'Golden Crust'],
    dietary: ['Vegetarian'],
    image: oreoCheesecakeImg,
  },
];

// Deprecated in Part 6: Live Google Reviews are now fetched dynamically via Google Places API (New) in TestimonialsSection.tsx
export const TESTIMONIALS: Testimonial[] = [];

export const GALLERY_ITEMS = [
  {
    title: 'Artisan latte art poured with silky micro-foam',
    image: latteArtImg,
    alt: 'Specialty coffee latte art in ceramic cup at Venty',
  },
  {
    title: 'Signature Oreo cheesecake with creamy vanilla and chocolate biscuit crust',
    image: oreoCheesecakeImg,
    alt: 'Venty signature Oreo cheesecake dessert',
  },
  {
    title: 'Vibrant freshly squeezed seasonal fruit juices and iced coolers',
    image: juicesImg,
    alt: 'Fresh artisanal juices and coolers at Venty',
  },
  {
    title: 'Layered iced specialty latte with rich espresso swirls and crystal ice',
    image: icedSpecialtyImg,
    alt: 'Chilled iced coffee at Venty The Coffee',
  },
  {
    title: 'Cozy evening coffee moments on the terrace overlooking Miliana',
    image: coffeeMomentsImg,
    alt: 'Relaxed cafe moments and atmosphere in Miliana Algeria',
  },
];
