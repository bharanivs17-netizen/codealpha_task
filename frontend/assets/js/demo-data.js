/**
 * demo-data.js — Fallback demo data for offline/no-DB mode
 * Used when the API is unavailable (MongoDB not connected)
 */

export const DEMO_CATEGORIES = [
  { _id: 'cat1', name: 'Electronics', slug: 'electronics', icon: '🖥️', description: 'Laptops, phones & gadgets' },
  { _id: 'cat2', name: 'Fashion',     slug: 'fashion',     icon: '👗', description: 'Clothing & apparel' },
  { _id: 'cat3', name: 'Footwear',    slug: 'footwear',    icon: '👟', description: 'Shoes & sneakers' },
  { _id: 'cat4', name: 'Audio',       slug: 'audio',       icon: '🎧', description: 'Headphones & speakers' },
  { _id: 'cat5', name: 'Wearables',   slug: 'wearables',   icon: '⌚', description: 'Smartwatches & fitness' },
  { _id: 'cat6', name: 'Accessories', slug: 'accessories', icon: '💼', description: 'Bags, wallets & more' },
];

export const DEMO_PRODUCTS = [
  {
    _id: 'p1',
    name: 'MacBook Pro 16"',
    slug: 'macbook-pro-16',
    shortDesc: 'M3 Pro chip, Liquid Retina XDR display',
    description: 'The most powerful MacBook Pro ever. With M3 Pro chip, up to 18 hours of battery life, and a stunning Liquid Retina XDR display.',
    price: 2499,
    discount: 10,
    finalPrice: 2249,
    stock: 15,
    brand: 'Apple',
    category: { _id: 'cat1', name: 'Electronics' },
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80'],
    averageRating: 4.9,
    numReviews: 128,
    isFeatured: true,
    tags: ['apple', 'laptop', 'macbook'],
    features: ['M3 Pro chip', '36GB RAM', '1TB SSD', '16" Retina display'],
  },
  {
    _id: 'p2',
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    shortDesc: 'Titanium design, A17 Pro chip, 48MP camera',
    description: 'The most advanced iPhone ever. Forged in titanium with A17 Pro chip and the most capable iPhone camera system ever.',
    price: 1199,
    discount: 0,
    finalPrice: 1199,
    stock: 30,
    brand: 'Apple',
    category: { _id: 'cat1', name: 'Electronics' },
    thumbnail: 'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=600&q=80'],
    averageRating: 4.8,
    numReviews: 256,
    isFeatured: true,
    tags: ['apple', 'iphone', 'smartphone'],
    features: ['A17 Pro chip', '48MP camera', 'Titanium design', 'USB-C'],
  },
  {
    _id: 'p3',
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    shortDesc: 'Industry-leading noise cancellation headphones',
    description: 'The best noise cancelling headphones with exceptional sound quality, 30-hour battery life, and crystal-clear hands-free calling.',
    price: 399,
    discount: 15,
    finalPrice: 339,
    stock: 45,
    brand: 'Sony',
    category: { _id: 'cat4', name: 'Audio' },
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'],
    averageRating: 4.7,
    numReviews: 89,
    isFeatured: true,
    tags: ['sony', 'headphones', 'audio', 'noise-cancelling'],
    features: ['30hr battery', 'ANC', 'Multipoint connection', 'Foldable design'],
  },
  {
    _id: 'p4',
    name: 'Nike Air Jordan 1 Retro',
    slug: 'nike-air-jordan-1-retro',
    shortDesc: 'Classic silhouette, premium leather upper',
    description: 'The shoe that started it all. The Air Jordan 1 Retro High OG features premium leather and the original colour-blocking.',
    price: 180,
    discount: 0,
    finalPrice: 180,
    stock: 60,
    brand: 'Nike',
    category: { _id: 'cat3', name: 'Footwear' },
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'],
    averageRating: 4.9,
    numReviews: 340,
    isFeatured: false,
    tags: ['nike', 'jordan', 'sneakers', 'basketball'],
    features: ['Leather upper', 'Air-Sole unit', 'Rubber outsole', 'Padded collar'],
  },
  {
    _id: 'p5',
    name: 'Apple Watch Ultra 2',
    slug: 'apple-watch-ultra-2',
    shortDesc: 'Titanium case, dual-frequency GPS, 60hr battery',
    description: 'The most rugged and capable Apple Watch ever. Designed for athletes and adventurers with dual-frequency GPS and 60-hour battery.',
    price: 799,
    discount: 0,
    finalPrice: 799,
    stock: 20,
    brand: 'Apple',
    category: { _id: 'cat5', name: 'Wearables' },
    thumbnail: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80'],
    averageRating: 4.8,
    numReviews: 67,
    isFeatured: true,
    tags: ['apple', 'watch', 'smartwatch', 'fitness'],
    features: ['Titanium case', 'Dual GPS', '60hr battery', 'Depth gauge'],
  },
  {
    _id: 'p6',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    shortDesc: '200MP camera, built-in S Pen, AI features',
    description: 'The ultimate Android experience with a 200MP camera, integrated S Pen, and Galaxy AI for next-level productivity.',
    price: 1299,
    discount: 8,
    finalPrice: 1195,
    stock: 25,
    brand: 'Samsung',
    category: { _id: 'cat1', name: 'Electronics' },
    thumbnail: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80'],
    averageRating: 4.6,
    numReviews: 112,
    isFeatured: false,
    tags: ['samsung', 'android', 'galaxy', 'smartphone'],
    features: ['200MP camera', 'S Pen', 'Galaxy AI', 'Titanium frame'],
  },
  {
    _id: 'p7',
    name: 'Adidas Ultraboost 23',
    slug: 'adidas-ultraboost-23',
    shortDesc: 'Responsive BOOST cushioning, Primeknit upper',
    description: 'Experience incredible energy return with every stride. The Ultraboost 23 features responsive BOOST midsole and a flexible Primeknit upper.',
    price: 190,
    discount: 20,
    finalPrice: 152,
    stock: 80,
    brand: 'Adidas',
    category: { _id: 'cat3', name: 'Footwear' },
    thumbnail: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80'],
    averageRating: 4.5,
    numReviews: 198,
    isFeatured: false,
    tags: ['adidas', 'running', 'sneakers', 'ultraboost'],
    features: ['BOOST midsole', 'Primeknit upper', 'Continental rubber', 'Torsion system'],
  },
  {
    _id: 'p8',
    name: 'Louis Vuitton Neverfull MM',
    slug: 'lv-neverfull-mm',
    shortDesc: 'Iconic canvas tote bag, roomy and stylish',
    description: 'The Neverfull MM is a spacious and adaptable tote bag crafted from Monogram canvas with a customisable silhouette.',
    price: 1700,
    discount: 0,
    finalPrice: 1700,
    stock: 8,
    brand: 'Louis Vuitton',
    category: { _id: 'cat6', name: 'Accessories' },
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80'],
    averageRating: 4.9,
    numReviews: 44,
    isFeatured: true,
    tags: ['lv', 'luxury', 'bag', 'tote'],
    features: ['Monogram canvas', 'Leather trim', 'Interior pocket', 'Removable pouch'],
  },
];

/**
 * Returns a paginated, filtered slice of demo products
 */
export function getDemoProducts({ sort = 'newest', limit = 8, featured, keyword, category } = {}) {
  let products = [...DEMO_PRODUCTS];

  if (featured)  products = products.filter(p => p.isFeatured);
  if (category)  products = products.filter(p => p.category._id === category);
  if (keyword)   products = products.filter(p =>
    p.name.toLowerCase().includes(keyword.toLowerCase()) ||
    p.tags.some(t => t.includes(keyword.toLowerCase()))
  );

  if (sort === 'price-asc')  products.sort((a,b) => a.finalPrice - b.finalPrice);
  if (sort === 'price-desc') products.sort((a,b) => b.finalPrice - a.finalPrice);
  if (sort === 'rating')     products.sort((a,b) => b.averageRating - a.averageRating);
  if (sort === 'popular')    products.sort((a,b) => b.numReviews - a.numReviews);

  return {
    products: products.slice(0, Number(limit)),
    total: products.length,
    pages: 1,
  };
}
