import { sanitizeString } from "../utils";
import { Deck } from "./Deck";
import { throws } from "assert";

export class Card {
  public question: string;
  public answer: string;
  public tags: string[];
  public id?: number;
  public deck?: Deck;
  public fields?: any;
  public deckName?: string;

  constructor(question: string, answer: string, tags: string[] = []) {
    this.question = question;
    this.answer = answer;
    this.tags = tags;
  }

  /**
   * Add tag to card in supported format
   */
  addTag(dirtyTag: string) {
    const tag = sanitizeString(dirtyTag);
    if (tag) {
      this.tags.push(tag);
    }
  }

  /** Set the ID on the Card object */
  setId(id: number) {
    this.id = id;
    return this;
  }

  setDeck(deck: Deck) {
    this.deck = deck;
    return this;
  }

  setFields(fields: any) {
    this.fields = fields;
    return this;
  }

  setDeckName(deckName: string) {
    this.deckName = deckName;
    return this;
  }
}
