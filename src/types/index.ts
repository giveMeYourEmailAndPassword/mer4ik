export interface MerchTemplate {
  id: string;
  name: string;
  imageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  printableArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface UserImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export type MerchType = 'tshirt' | 'mug' | 'hoodie';

export interface EditorState {
  selectedTemplate: MerchTemplate | null;
  userImage: UserImage | null;
  isEditing: boolean;
}