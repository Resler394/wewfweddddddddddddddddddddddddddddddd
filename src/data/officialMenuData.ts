export interface OfficialMenuItemOption {
  name: string;
  choices: {
    label: string;
    priceDelta: number;
  }[];
}

export interface OfficialMenuItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  category: 'coffee' | 'drinks' | 'fresh' | 'sweets' | 'desserts';
  subCategory: string;
  currency?: string;
  available?: boolean;
  description?: string;
  dietary?: ('Vegan' | 'GF' | 'Contains Nuts' | 'Dairy-Free' | 'Sugar-Free')[];
  isSeasonal?: boolean;
  seasonalNote?: string;
  options?: OfficialMenuItemOption[];
}

export interface OfficialMenuSubcategory {
  title: string;
  subtitle?: string;
  theme: 'burgundy' | 'cream';
  category: 'coffee' | 'drinks' | 'fresh' | 'sweets' | 'desserts';
  items: OfficialMenuItem[];
}

export interface OfficialMenuCategorySection {
  id: 'coffee' | 'drinks' | 'fresh' | 'sweets' | 'desserts';
  label: string;
  tagline: string;
  subcategories: OfficialMenuSubcategory[];
}

export const OFFICIAL_CATEGORIES: OfficialMenuCategorySection[] = [
  {
    id: 'coffee',
    label: 'Coffee',
    tagline: 'Espresso extractions, silky milk lattes, & flavor additions',
    subcategories: [
      {
        title: 'COFFEE',
        category: 'coffee',
        theme: 'burgundy',
        items: [
          { id: 'coffee-ristretto', name: 'Ristretto', price: '80 DA', priceNum: 80, category: 'coffee', subCategory: 'COFFEE', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'coffee-espresso', name: 'Espresso', price: '100 DA', priceNum: 100, category: 'coffee', subCategory: 'COFFEE', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'coffee-doppio', name: 'Doppio', price: '150 DA', priceNum: 150, category: 'coffee', subCategory: 'COFFEE', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'coffee-lungo', name: 'Lungo', price: '100 DA', priceNum: 100, category: 'coffee', subCategory: 'COFFEE', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'coffee-americano', name: 'Americano', price: '150 DA', priceNum: 150, category: 'coffee', subCategory: 'COFFEE', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'coffee-long-black', name: 'Long Black', price: '150 DA', priceNum: 150, category: 'coffee', subCategory: 'COFFEE', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'coffee-cold-brew', name: 'Cold Brew', price: '100 DA', priceNum: 100, category: 'coffee', subCategory: 'COFFEE', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
        ],
      },
      {
        title: 'COFFEE / LATTE',
        category: 'coffee',
        theme: 'burgundy',
        items: [
          {
            id: 'latte-classic',
            name: 'Latte',
            price: '300 DA',
            priceNum: 300,
            category: 'coffee',
            subCategory: 'COFFEE / LATTE',
            currency: 'DA',
            available: true,
            dietary: ['GF'],
            options: [
              {
                name: 'Add Flavor Syrup',
                choices: [
                  { label: 'None', priceDelta: 0 },
                  { label: 'Hazelnut (+50 DA)', priceDelta: 50 },
                  { label: 'Caramel (+50 DA)', priceDelta: 50 },
                  { label: 'Vanilla (+50 DA)', priceDelta: 50 },
                  { label: 'Pistachio (+50 DA)', priceDelta: 50 },
                ],
              },
            ],
          },
          { id: 'latte-cappuccino', name: 'Cappuccino', price: '300 DA', priceNum: 300, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'latte-cortado', name: 'Cortado', price: '250 DA', priceNum: 250, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'latte-flat-white', name: 'Flat White', price: '250 DA', priceNum: 250, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'latte-cafe-au-lait', name: 'Cafe Au Lait', price: '150 DA', priceNum: 150, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'latte-spanish-latte', name: 'Spanish Latte', price: '300 DA', priceNum: 300, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'], isSeasonal: true, seasonalNote: 'House Favorite' },
          { id: 'latte-mocha', name: 'Mocha', price: '300 DA', priceNum: 300, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'latte-dalgona', name: 'Dalgona Latte', price: '300 DA', priceNum: 300, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'latte-matcha', name: 'Matcha Green Latte', price: '600 DA', priceNum: 600, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'], isSeasonal: true, seasonalNote: 'Specialty Import' },
          { id: 'latte-hot-chocolate', name: 'Hot Chocolate', price: '300 DA', priceNum: 300, category: 'coffee', subCategory: 'COFFEE / LATTE', currency: 'DA', available: true, dietary: ['GF'] },
        ],
      },
      {
        title: 'FLAVORS',
        subtitle: 'Syrups & additions',
        category: 'coffee',
        theme: 'burgundy',
        items: [
          { id: 'flavor-hazelnut', name: 'Hazelnut', price: '50 DA', priceNum: 50, category: 'coffee', subCategory: 'FLAVORS', currency: 'DA', available: true, dietary: ['Contains Nuts', 'Vegan'] },
          { id: 'flavor-pistachio', name: 'Pistachio', price: '50 DA', priceNum: 50, category: 'coffee', subCategory: 'FLAVORS', currency: 'DA', available: true, dietary: ['Contains Nuts', 'Vegan'] },
          { id: 'flavor-caramel', name: 'Caramel', price: '50 DA', priceNum: 50, category: 'coffee', subCategory: 'FLAVORS', currency: 'DA', available: true, dietary: ['Vegan'] },
          { id: 'flavor-vanilla', name: 'Vanilla', price: '50 DA', priceNum: 50, category: 'coffee', subCategory: 'FLAVORS', currency: 'DA', available: true, dietary: ['Vegan'] },
        ],
      },
    ],
  },
  {
    id: 'drinks',
    label: 'Drinks',
    tagline: 'Sparkling mojitos, thick milkshakes & handcrafted mocktails',
    subcategories: [
      {
        title: 'MOJITOS',
        category: 'drinks',
        theme: 'cream',
        items: [
          { id: 'mojito-classic', name: 'Classic Mojito', price: '350 DA', priceNum: 350, category: 'drinks', subCategory: 'MOJITOS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'mojito-virgin', name: 'Virgin Mojito', price: '350 DA', priceNum: 350, category: 'drinks', subCategory: 'MOJITOS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'mojito-flavored', name: 'Flavored Mojito', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOJITOS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
        ],
      },
      {
        title: 'MILKSHAKES',
        category: 'drinks',
        theme: 'cream',
        items: [
          { id: 'milkshake-chocolate', name: 'Chocolate Milkshake', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MILKSHAKES', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'milkshake-caramel', name: 'Caramel Milkshake', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MILKSHAKES', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'milkshake-vanilla', name: 'Vanilla Milkshake', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MILKSHAKES', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'milkshake-fruit', name: 'Fruit Milkshake', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MILKSHAKES', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'milkshake-oreo', name: 'Oreo Milkshake', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MILKSHAKES', currency: 'DA', available: true },
        ],
      },
      {
        title: 'MOCKTAILS',
        category: 'drinks',
        theme: 'cream',
        items: [
          { id: 'mocktail-bora-bora', name: 'Bora Bora', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOCKTAILS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'mocktail-blue-hawaii', name: 'Blue Hawaii', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOCKTAILS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'mocktail-pink-lady', name: 'Pink Lady', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOCKTAILS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'mocktail-blue-lady', name: 'Blue Lady', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOCKTAILS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'mocktail-exotic-splash', name: 'Exotic Splash', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOCKTAILS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'], isSeasonal: true, seasonalNote: 'Summer Cooler' },
          { id: 'mocktail-pina-colada', name: 'Pina Colada', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOCKTAILS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'mocktail-red-cactus', name: 'Red Cactus', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOCKTAILS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'], isSeasonal: true, seasonalNote: 'Botanical Special' },
          { id: 'mocktail-florida-sunshine', name: 'Florida Sunshine', price: '400 DA', priceNum: 400, category: 'drinks', subCategory: 'MOCKTAILS', currency: 'DA', available: true, dietary: ['Vegan', 'GF'], isSeasonal: true, seasonalNote: 'Citrus Special' },
        ],
      },
    ],
  },
  {
    id: 'fresh',
    label: 'Fresh',
    tagline: 'Pure freshly squeezed citrus juices, coolers & hot teas',
    subcategories: [
      {
        title: 'NATURAL',
        subtitle: '100% Pure & Fresh Juices',
        category: 'fresh',
        theme: 'cream',
        items: [
          { id: 'juice-orange', name: 'Orange Juice', price: '300 DA', priceNum: 300, category: 'fresh', subCategory: 'NATURAL', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'juice-lemon', name: 'Lemon Juice', price: '350 DA', priceNum: 350, category: 'fresh', subCategory: 'NATURAL', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'juice-strawberry', name: 'Strawberry Juice', price: '300 DA', priceNum: 300, category: 'fresh', subCategory: 'NATURAL', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'juice-banana', name: 'Banana Juice', price: '300 DA', priceNum: 300, category: 'fresh', subCategory: 'NATURAL', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'juice-pineapple', name: 'Pineapple Juice', price: '350 DA', priceNum: 350, category: 'fresh', subCategory: 'NATURAL', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'juice-2-fruits', name: '2 Fruits Cocktail', price: '350 DA', priceNum: 350, category: 'fresh', subCategory: 'NATURAL', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'juice-3-4-fruits', name: '3–4 Fruits Cocktail', price: '400 DA', priceNum: 400, category: 'fresh', subCategory: 'NATURAL', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
        ],
      },
      {
        title: 'TEA',
        subtitle: 'Traditional & infused',
        category: 'fresh',
        theme: 'burgundy',
        items: [
          { id: 'tea-normal', name: 'Normal Tea', price: '70 DA', priceNum: 70, category: 'fresh', subCategory: 'TEA', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'tea-infusion', name: 'Infusion Tea', price: '100 DA', priceNum: 100, category: 'fresh', subCategory: 'TEA', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'tea-iced', name: 'Iced Tea', price: '200 DA', priceNum: 200, category: 'fresh', subCategory: 'TEA', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'tea-ginger', name: 'Ginger', price: '70 DA', priceNum: 70, category: 'fresh', subCategory: 'TEA', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'tea-local-infusion', name: 'Local Infusion', price: '150 DA', priceNum: 150, category: 'fresh', subCategory: 'TEA', currency: 'DA', available: true, dietary: ['Vegan', 'GF'], isSeasonal: true, seasonalNote: 'Miliana Harvest' },
        ],
      },
    ],
  },
  {
    id: 'sweets',
    label: 'Sweets',
    tagline: 'Fresh morning bakery, golden crêpes & warm chocolate waffles',
    subcategories: [
      {
        title: 'STYLES',
        subtitle: 'Bakery & Viennoiserie',
        category: 'sweets',
        theme: 'burgundy',
        items: [
          { id: 'style-croissant', name: 'Croissant', price: '200 DA', priceNum: 200, category: 'sweets', subCategory: 'STYLES', currency: 'DA', available: true },
          { id: 'style-goelette', name: 'Goélette', price: '150 DA', priceNum: 150, category: 'sweets', subCategory: 'STYLES', currency: 'DA', available: true },
          { id: 'style-brownie', name: 'Brownie', price: '150 DA', priceNum: 150, category: 'sweets', subCategory: 'STYLES', currency: 'DA', available: true, dietary: ['Contains Nuts'] },
          { id: 'style-pastry', name: 'Pastry', price: '220 DA', priceNum: 220, category: 'sweets', subCategory: 'STYLES', currency: 'DA', available: true },
          { id: 'style-todays-sweet', name: "Today's Sweet", price: '400 DA', priceNum: 400, category: 'sweets', subCategory: 'STYLES', currency: 'DA', available: true, isSeasonal: true, seasonalNote: 'Daily Bake' },
        ],
      },
      {
        title: 'CRÊPES',
        category: 'sweets',
        theme: 'cream',
        items: [
          { id: 'crepe-tarte', name: 'Tarte Crêpe', price: '200 DA', priceNum: 200, category: 'sweets', subCategory: 'CRÊPES', currency: 'DA', available: true },
          { id: 'crepe-chocolatee', name: 'Chocolatée crêpe', price: '300 DA', priceNum: 300, category: 'sweets', subCategory: 'CRÊPES', currency: 'DA', available: true },
          { id: 'crepe-1-fruit-chocolate', name: '1 Fruits Chocolate Crêpe', price: '400 DA', priceNum: 400, category: 'sweets', subCategory: 'CRÊPES', currency: 'DA', available: true },
          { id: 'crepe-2-fruits-chocolate', name: '2 Fruits Chocolate Crêpe', price: '450 DA', priceNum: 450, category: 'sweets', subCategory: 'CRÊPES', currency: 'DA', available: true },
          { id: 'crepe-3-fruits-chocolate', name: '3 Fruits Chocolate Crêpe', price: '500 DA', priceNum: 500, category: 'sweets', subCategory: 'CRÊPES', currency: 'DA', available: true, isSeasonal: true, seasonalNote: 'Seasonal Berries' },
        ],
      },
      {
        title: 'WAFFLES',
        category: 'sweets',
        theme: 'cream',
        items: [
          { id: 'waffle-chocolate', name: 'Chocolate Waffles', price: '350 DA', priceNum: 350, category: 'sweets', subCategory: 'WAFFLES', currency: 'DA', available: true },
          { id: 'waffle-1-fruit-chocolate', name: '1 Fruit Chocolate Waffles', price: '400 DA', priceNum: 400, category: 'sweets', subCategory: 'WAFFLES', currency: 'DA', available: true },
          { id: 'waffle-2-fruits-chocolate', name: '2 Fruits Chocolate Waffles', price: '450 DA', priceNum: 450, category: 'sweets', subCategory: 'WAFFLES', currency: 'DA', available: true },
        ],
      },
    ],
  },
  {
    id: 'desserts',
    label: 'Desserts',
    tagline: 'Basque burnt cakes, artisan cheesecakes & gourmet toppings',
    subcategories: [
      {
        title: 'STYLES DESSERT',
        category: 'desserts',
        theme: 'burgundy',
        items: [
          { id: 'dessert-banque-burnt-cheesecake', name: 'Banque Burnt Cheesecake (Sans/Gluten/Sucre)', price: '400 DA', priceNum: 400, category: 'desserts', subCategory: 'STYLES DESSERT', currency: 'DA', available: true, dietary: ['GF', 'Sugar-Free'], isSeasonal: true, seasonalNote: 'Artisan Batch' },
          { id: 'dessert-gateau-basque', name: 'Gâteau Basque', price: '400 DA', priceNum: 400, category: 'desserts', subCategory: 'STYLES DESSERT', currency: 'DA', available: true },
          { id: 'dessert-quesselle', name: 'Queselle', price: '300 DA', priceNum: 300, category: 'desserts', subCategory: 'STYLES DESSERT', currency: 'DA', available: true },
          { id: 'dessert-fondant-chocolat', name: 'Fondant au chocolat', price: '350 DA', priceNum: 350, category: 'desserts', subCategory: 'STYLES DESSERT', currency: 'DA', available: true },
          { id: 'dessert-tiramisu', name: 'Tiramisu', price: '400 DA', priceNum: 400, category: 'desserts', subCategory: 'STYLES DESSERT', currency: 'DA', available: true },
          { id: 'dessert-fruit-salad', name: 'Fruit Salad (Season Fruits)', price: '400 DA', priceNum: 400, category: 'desserts', subCategory: 'STYLES DESSERT', currency: 'DA', available: true, dietary: ['Vegan', 'GF'], isSeasonal: true, seasonalNote: 'Fresh Market' },
          { id: 'dessert-todays-dessert', name: "Today's Dessert", price: '400 DA', priceNum: 400, category: 'desserts', subCategory: 'STYLES DESSERT', currency: 'DA', available: true, isSeasonal: true, seasonalNote: "Chef's Creation" },
        ],
      },
      {
        title: 'CHEESECAKE',
        category: 'desserts',
        theme: 'cream',
        items: [
          { id: 'cheesecake-chocolate', name: 'Chocolate Cheesecake', price: '400 DA', priceNum: 400, category: 'desserts', subCategory: 'CHEESECAKE', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'cheesecake-pistachio', name: 'Pistachio Cheesecake', price: '350 DA', priceNum: 350, category: 'desserts', subCategory: 'CHEESECAKE', currency: 'DA', available: true, dietary: ['Contains Nuts', 'GF'] },
          { id: 'cheesecake-red-fruit', name: 'Red Fruit Cheesecake', price: '400 DA', priceNum: 400, category: 'desserts', subCategory: 'CHEESECAKE', currency: 'DA', available: true, dietary: ['GF'] },
          { id: 'cheesecake-todays', name: "Today's Cheesecake", price: '400 DA', priceNum: 400, category: 'desserts', subCategory: 'CHEESECAKE', currency: 'DA', available: true, isSeasonal: true, seasonalNote: 'Fresh Daily' },
        ],
      },
      {
        title: 'SUPPLÉMENT',
        subtitle: 'Extras & toppings',
        category: 'desserts',
        theme: 'cream',
        items: [
          { id: 'supplement-hazelnut', name: 'Hazelnut', price: '160 DA', priceNum: 160, category: 'desserts', subCategory: 'SUPPLÉMENT', currency: 'DA', available: true, dietary: ['Contains Nuts', 'Vegan', 'GF'] },
          { id: 'supplement-walnut', name: 'Walnut', price: '100 DA', priceNum: 100, category: 'desserts', subCategory: 'SUPPLÉMENT', currency: 'DA', available: true, dietary: ['Contains Nuts', 'Vegan', 'GF'] },
          { id: 'supplement-peanut', name: 'Peanut', price: '100 DA', priceNum: 100, category: 'desserts', subCategory: 'SUPPLÉMENT', currency: 'DA', available: true, dietary: ['Contains Nuts', 'Vegan', 'GF'] },
          { id: 'supplement-1-fruit', name: '1 Fruit', price: '100 DA', priceNum: 100, category: 'desserts', subCategory: 'SUPPLÉMENT', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
          { id: 'supplement-2-fruits', name: '2 Fruits', price: '150 DA', priceNum: 150, category: 'desserts', subCategory: 'SUPPLÉMENT', currency: 'DA', available: true, dietary: ['Vegan', 'GF'] },
        ],
      },
    ],
  },
];

// Helper to get flat list of all official items
export const getAllOfficialProducts = (): OfficialMenuItem[] => {
  const list: OfficialMenuItem[] = [];
  OFFICIAL_CATEGORIES.forEach((cat) => {
    cat.subcategories.forEach((sub) => {
      list.push(...sub.items);
    });
  });
  return list;
};

export const getOfficialProductById = (id: string): OfficialMenuItem | undefined => {
  return getAllOfficialProducts().find((p) => p.id === id);
};

export const OFFICIAL_MENU_CONTACT = {
  instagram: 'Ventythecoffee20',
  instagramUrl: 'https://instagram.com/Ventythecoffee20',
  facebook: 'Ventythecoffee20',
  facebookUrl: 'https://facebook.com/Ventythecoffee20',
  tiktok: 'Ventythecoffee20',
  tiktokUrl: 'https://tiktok.com/@Ventythecoffee20',
  phone: '+213 (6) 59 00 50 16',
  phoneClean: '+213659005016',
  location: 'Miliana, Ain Defla, Algeria',
};
