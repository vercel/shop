export interface Image {
  altText: string;
  blurDataURL?: string;
  height: number;
  url: string;
  width: number;
}

export interface Video {
  height: number;
  previewImage: Image | null;
  url: string;
  width: number;
}
