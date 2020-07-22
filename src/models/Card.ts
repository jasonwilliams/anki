const { sanitizeString } = require("../utils");

export class Card {
  public question: string;
  public answer: string;
  public tags: string[];
  public id: number;

  constructor(question: string, answer: string, id: number, tags = []) {
    this.question = question;
    this.answer = answer;
    this.id = id;
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
}
