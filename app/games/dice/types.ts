export type Position = { x: number; y: number };
export type ItemType = 'plus2' | 'plus3' | 'shield' | 'minus2' | 'minus5' | 'extraRoll' | 'sword' | 'gun';
export type Item = { pos: Position; type: ItemType; createdAt: number };

export interface ActiveItem {
  type: ItemType;
  turns: number;
}
