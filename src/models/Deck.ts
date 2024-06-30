import { workspace } from "vscode";
import { AnkiService } from "../AnkiService";
import { Card } from "./Card";
import { SendDiff } from "./SendDiff";

export class Deck {
  public readonly name: string;
  private options: any;
  public cards: Card[];
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
    return this.cards.some((v) => v.noteId === cardId);
  }

  /** add media item to this deck */
  addMedia(media: any) {
    this.mediaCollection.push(media);
  }

  private orderZeroFieldValue(card: Card): string | null {
    const field: any = Object.values(card.fields).find((field: any) => field.order === 0);
    if (field) {
      return field.value;
    } else {
      return null;
    }
  }

  private findDuplicate(ankiCards: Card[], testCard: Card): Card | undefined {
    return ankiCards.find((ankiCard) => {
      const ankiCardFront = this.orderZeroFieldValue(ankiCard);
      return ankiCardFront && ankiCardFront === testCard.question;
    });
  }

  // pull the deck from Anki
  // loop through the markdown cards looking for duplicates
  // request add or delete as appropriate based on config
  // track cards that are already in Anki
  // TODO: check to see if Anki actually added/deleted the notes
  // could be slow on very large decks
  async updateOrAdd(allowUpdates: boolean): Promise<SendDiff> {
    const ankiCards = await this.ankiService?.findCards(`deck:${this.name}`);
    // console.log('cards in deck', ankiCards);
    const diff = new SendDiff();
    if (ankiCards) {
      const cardsToDelete: Card[] = [];
      this.cards.forEach((c) => {
        // find the anki card with the same question value
        const duplicate = this.findDuplicate(ankiCards, c);
        // queue the anki card for deletion if it doesn't match the fields of the new card
        if (duplicate) {
          // console.log('found duplicate', duplicate);
          if (!c.fieldsMatch(duplicate) && allowUpdates) {
            cardsToDelete.push(duplicate);
            diff.cardsAdded.push(c);
          } else {
            diff.cardsUnchanged.push(duplicate);
          }
        } else {
          diff.cardsAdded.push(c);
        }
      });
      await this.deleteCards(cardsToDelete);
      diff.cardsDeleted = cardsToDelete; // not sure how to confirm actual deletion at this point
    }
    await this._pushNewCardsToAnki(diff.cardsAdded); // no confirmation of actual addition
    // console.log('diff i created', diff);
    return diff;
  }

  private async deleteCards(cards: Card[]) {
    const nIds: number[] = cards.filter((card) => card.noteId).map((card) => card.noteId!);
    await this.ankiService?.deleteNotes(nIds);
  }

  // updates card references in place.
  private async _pushNewCardsToAnki(cards: Card[]) {
    const ids = await this.ankiService?.addNotes(cards);
    ids?.map((v, i) => (cards[i].noteId = v));
  }

  // Calls anki to update the fields of all the passed cards.
  private async _pushUpdatedCardsToAnki(cards: Card[]): Promise<void> {
    // This should be in sequence to not overload AnkiConnect's connection limit
    for (const card of cards) {
      await this.ankiService?.updateFields(card);
    }
  }

  async createAndUpdateCards(): Promise<Card[]> {
    // Push the updated cards (based on noteID)
    let updateCards: Card[] = [];
    let newCards: Card[] = [];
    this.cards.forEach((card) => (card.noteId ? updateCards.push(card) : newCards.push(card)));
    if (workspace.getConfiguration("anki.md").get("updateCards")) {
      await this._pushUpdatedCardsToAnki(updateCards);
    }
    await this._pushNewCardsToAnki(newCards);
    return newCards;
  }

  // Anki Service Methods

  async createOnAnki() {
    // If this deck has an ID it's already created on Anki
    if (this.ankiService && !this.id) {
      const id = await this.ankiService.createDeck(this.name);
      this.id = id;
    } else {
      throw new Error("Deck cannot be created because it either has an ID or can't use Service");
    }
  }

  async save() {
    // First create the deck if it doesn't already exist
    await this.createOnAnki();

    //
  }
}
