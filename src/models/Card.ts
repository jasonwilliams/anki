const { sanitizeString } = require("../utils");

class Card {
  private front: string;
  private back: string;
  private tags: string[];

  constructor(front: string, back: string, tags = []) {
    this.front = front;
    this.back = back;
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

module.exports = Card;
