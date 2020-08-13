import { Card } from "./Card";
import { AnkiService } from "../AnkiService";

export class Deck {
  public readonly name: string;
  private options: any;
  private cards: Card[];
  private mediaCollection: any[];
  private ankiService?: AnkiService;
  /** Id is optional on Decks because they can be created before syncing back to Anki.
   * Therefore, newly created decks won't have IDs (this is currently not implemented though)
   * So for now we can assume all decks have an id.
   */
  public id?: number;

  constructor(name: string, options = {}) {
    this.name = name;
    this.options = options;
    this.cards = [];
    this.mediaCollection = [];
  }

  setId(id: number) {
    this.id = id;
    return this;
  }

  setAnkiService(ankiService: AnkiService) {
    this.ankiService = ankiService;
    return this;
  }

  /** add card to this deck */
  addCard(card: Card) {
    card.setDeck(this);
    this.cards.push(card);
  }

  /** Check if this deck has a card by passing the card ID */
  hasCard(cardId: number) {
    return this.cards.some((v) => v.id === cardId);
  }

  /** add media item to this deck */
  addMedia(media: any) {
    this.mediaCollection.push(media);
  }

  async pushNewCardsToAnki() {
    const newCards = this.cards.filter((v) => !v.id);
    const ids = await this.ankiService?.addNotes(newCards);
    ids?.map((v, i) => (newCards[i].id = v));
  }

  // Anki Service Methods

  async createOnAnki() {
    // If this deck has an ID it's already created on Anki
    if (this.ankiService && !this.id) {
      const id = await this.ankiService.createDeck(this.name);
      this.id = id;
    } else {
      throw new Error(
        "Deck cannot be created because it either has an ID or can't use Service"
      );
    }
  }

  async save() {
    // First create the deck if it doesn't already exist
    await this.createOnAnki();

    //
  }
}
