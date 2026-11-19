//Imports
import type { ImageSourcePropType } from "react-native";

// SHOP ITEMS
// Everything that can be bought in the shop.
// To add an item: add a line here. The shop page shows it by itself.
// When a drawing is ready: add `image: require("...")`, it replaces the icon.

export type ShopCategory = "beanbag" | "house" | "decoration";

export type ShopItem = {
  id: string;                  // unique, never change it (it's what is saved in Firebase)
  name: string;
  category: ShopCategory;
  price: number;               // in apples
  icon: string;                // placeholder icon (Material Design Icons name)
  image?: ImageSourcePropType; // your drawing, later
};

// The categories, in the order of the shop page.
// "only one" = equipping one replaces the other (one house at a time).
export const CATEGORIES: { id: ShopCategory; title: string; onlyOne: boolean }[] = [
  { id: "beanbag", title: "Beanbags", onlyOne: true },
  { id: "house", title: "Houses", onlyOne: true },
  { id: "decoration", title: "Decorations", onlyOne: false },
];

export const SHOP_ITEMS: ShopItem[] = [
  // Beanbags
  { id: "beanbag_cozy", name: "Cozy beanbag", category: "beanbag", price: 10, icon: "sofa-single-outline" },
  { id: "beanbag_fluffy", name: "Fluffy beanbag", category: "beanbag", price: 20, icon: "sofa-single" },
  { id: "beanbag_royal", name: "Royal beanbag", category: "beanbag", price: 40, icon: "seat" },

  // Houses
  { id: "house_box", name: "Cardboard box", category: "house", price: 15, icon: "package-variant" },
  { id: "house_hut", name: "Wooden hut", category: "house", price: 35, icon: "home" },
  { id: "house_castle", name: "Little castle", category: "house", price: 80, icon: "castle" },

  // Decorations
  { id: "deco_plant", name: "Plant", category: "decoration", price: 8, icon: "flower" },
  { id: "deco_lamp", name: "Lamp", category: "decoration", price: 12, icon: "lamp" },
];

// Finds an item by its id
export function findItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}