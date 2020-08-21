import { sanitizeString } from "../utils";
import { Deck } from "./Deck";
import { CONSTANTS } from "../constants";

export class Card {
  public question: string;
  public answer: string;
  public tags: string[];
  public fields: any;
  public modelName: string;
  public id?: number;
  public deck?: Deck;
  public deckName?: string;

  constructor(
    question: string,
    answer: string,
    tags: string[] = [],
    model: string = CONSTANTS.defaultTemplateName
  ) {
    this.question = question;
    this.answer = answer;
    this.tags = tags;
    this.modelName = model;

    // The fields need to match the template, cloze has different fields
    if (this.modelName === CONSTANTS.defaultTemplateName) {
      this.fields = {
        Front: question,
        Back: answer,
      };
      // must be a Cloze note type
    } else {
      this.fields = {
        Text: question,
      };
    }
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

  setQuestion(q: string) {
    this.question = q;

    // Also set the fields
    // The fields need to match the template, cloze has different fields
    if (this.modelName === CONSTANTS.defaultTemplateName) {
      this.fields.Front = q;
      // must be a Cloze note type
    } else {
      this.fields.Text = q;
    }
  }

  setAnswer(a: string) {
    this.answer = a;

    // Also set the fields
    // The fields need to match the template, cloze has different fields
    if (this.modelName === CONSTANTS.defaultTemplateName) {
      this.fields.Back = a;
    }
  }

  toString() {
    return JSON.stringify(
      {
        id: this.id,
        question: this.question,
        answer: this.answer,
        deck: this.deckName,
        fields: this.fields,
      },
      null,
      4
    );
  }
}
