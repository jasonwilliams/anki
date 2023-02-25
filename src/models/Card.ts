import { sanitizeString } from "../utils";
import { Deck } from "./Deck";

export class Card {
  public question: string;
  public answer: string;
  public tags: string[];
  public fields: any;
  public modelName: string;
  public noteId?: number;
  public deck?: Deck;
  public deckName?: string;

  constructor(question: string, answer: string, tags: string[] = [], noteId: number = 0, model: string) {
    this.question = question;
    this.answer = answer;
    this.tags = tags;
    this.modelName = model;
    this.noteId = noteId;

    // must be a Cloze note type
    if (this.modelName === "Cloze") {
      this.fields = {
        Text: question,
      };
    } else {
      this.fields = {
        Front: question,
        Back: answer,
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
  setNoteId(id: number) {
    this.noteId = id;
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
    if (this.modelName === "Cloze") {
      this.fields.Text = q;
    } else {
      this.fields.Front = q;
    }
  }

  setAnswer(a: string) {
    this.answer = a;

    // Also set the fields
    // The fields need to match the template, cloze has different fields
    if (this.modelName !== "Cloze") {
      this.fields.Back = a;
    }
  }

  toString() {
    return JSON.stringify(
      {
        id: this.noteId,
        question: this.question,
        answer: this.answer,
        deck: this.deckName,
        fields: this.fields,
      },
      null,
      4
    );
  }

  // return false if any field in this card does not have a perfectly matching correlate in the anki card
  // this is how we check to see if the anki card needs to be updated
  fieldsMatch(ankiCard: Card): boolean {
    return !Object.keys(this.fields).some((key) => {
      return !(ankiCard.fields[key] && ankiCard.fields[key].value === this.fields[key]);
    });
  }
}
