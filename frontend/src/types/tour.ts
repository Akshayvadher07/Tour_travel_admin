export type TourCategory = "adventure" | "cultural" | "relaxation" | "wildlife" | "city";

export type Tour = {
  _id: string;
  title: string;
  destination: string;
  description: string;
  durationDays: number;
  priceFrom: number;
  /** Ordered list of image URLs. Index 0 is the cover image. */
  images: string[];
  /** Virtual — equals images[0]. Present for backward compat. */
  imageUrl?: string;
  category: TourCategory;
  featured: boolean;
  deleted?: boolean;
};

export type TourInput = {
  title: string;
  destination: string;
  description: string;
  durationDays: number;
  priceFrom: number;
  /** Ordered list of image URLs. At least one required. */
  images: string[];
  category: TourCategory;
  featured: boolean;
};

export type TourUpdate = Partial<TourInput & { deleted: boolean }>;