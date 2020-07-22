import { Card } from "./Card";

export class Deck {
  public readonly name: string;
  private options: any;
  private cards: Card[];
  private mediaCollection: any[];
  public readonly id: number;

  constructor(name: string, id: number, options = {}) {
    this.name = name;
    this.id = id;
    this.options = options;
    this.cards = [];
    this.mediaCollection = [];
  }

  /** add card to this deck */
  addCard(card: Card) {
    this.cards.push(card);
  }

  /** add media item to this deck */
  addMedia(media: any) {
    this.mediaCollection.push(media);
  }

  async save() {}
}
