export interface Artwork {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  artist: string;
  dimensions?: string;
  medium?: string;
}