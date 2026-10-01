export type Category = {
  title: string;
  image: string;
  icon: string;
  alt: string;
  active: boolean;
};

export type CheckoutPhotoKey =
  | "front"
  | "back"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "interior"
  | "label_tag"
  | "serial_number"
  | "logo";

export type PhotoSlot = {
  key: CheckoutPhotoKey;
  label: string;
  description: string;
};

export const figma = {
  hero: "/figma/hero-luxury-bags.png",
  mark: "/figma/modacert-mark.png",
  google: "/figma/google-g-logo.png",
};

export const navItems = [
  { label: "Authenticate", href: "/checkout" },
  { label: "Pricing", href: "/rates" },
  { label: "Brands", href: "/brands" },
  { label: "How it works", href: "/#how-it-works" },
] as const;

export const trustProof = {
  itemsAuthenticated: 0,
  customers: 0,
  reviewCount: 0,
  reviewRating: 0,
  reviewSourceUrl: "",
  verificationUrl: "",
  turnaround: "",
} as const;

export const categories: Category[] = [
  {
    title: "Handbags",
    image: "/figma/category-handbag.png",
    icon: "/figma/icon-shopping-bag.png",
    alt: "Luxury handbag authentication",
    active: true,
  },
  {
    title: "Clothing",
    image: "/figma/category-clothing-cropped.png",
    icon: "/figma/icon-tshirt.png",
    alt: "Luxury clothing authentication",
    active: true,
  },
  {
    title: "Watches",
    image: "/figma/category-watch.png",
    icon: "/landing/hero-watch.png",
    alt: "Luxury watch authentication",
    active: true,
  },
  {
    title: "Shoes",
    image: "/figma/shoes-lv-trainer-cropped.png",
    icon: "/figma/icon-sneaker.png",
    alt: "Luxury shoe authentication",
    active: true,
  },
  {
    title: "Jewelry",
    image: "/figma/category-jewelry.png",
    icon: "/figma/icon-jewelry.png",
    alt: "Luxury jewelry authentication",
    active: true,
  },
  {
    title: "Sneakers",
    image: "/figma/sneaker-air-jordan.png",
    icon: "/figma/icon-sneaker.png",
    alt: "Luxury sneaker authentication",
    active: true,
  },
  {
    title: "Eyewear",
    image: "/figma/rate-chanel-glasses.png",
    icon: "/figma/rate-chanel-glasses.png",
    alt: "Luxury eyewear authentication",
    active: true,
  },
  {
    title: "Accessories",
    image: "/figma/rate-hermes-orange-bag.png",
    icon: "/figma/icon-shopping-bag.png",
    alt: "Luxury accessory authentication",
    active: true,
  },
];

export const acceptedPhotoMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const acceptedPhotoInputTypes = acceptedPhotoMimeTypes.join(",");

export const checkoutPhotoSlots: PhotoSlot[] = [
  {
    key: "front",
    label: "Front view",
    description: "Full front side visible with clear lighting",
  },
  {
    key: "back",
    label: "Back view",
    description: "Full back side visible with clear lighting",
  },
  {
    key: "left",
    label: "Left side",
    description: "Left side profile and edge details",
  },
  {
    key: "right",
    label: "Right side",
    description: "Right side profile and edge details",
  },
  {
    key: "top",
    label: "Top view",
    description: "Top opening, handles, and upper construction",
  },
  {
    key: "bottom",
    label: "Bottom view",
    description: "Base, feet, soles, or lower construction",
  },
  {
    key: "interior",
    label: "Interior view",
    description: "Inside lining, pockets, and inner construction",
  },
  {
    key: "label_tag",
    label: "Label/tag",
    description: "Care label, size tag, or country of origin tag",
  },
  {
    key: "serial_number",
    label: "Serial number",
    description: "Date code, serial, or product code clearly shown",
  },
  {
    key: "logo",
    label: "Brand logo",
    description: "Logo stamp, print, embossing, or hardware logo",
  },
];
