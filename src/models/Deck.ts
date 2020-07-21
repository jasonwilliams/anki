const fs = require("fs");
const { default: AnkiExport } = require("anki-apkg-export");

/**
 * @typedef {import('./template').Template} Template
 * @typedef {import('./card').Card} Card
 * @typedef {import('./media').Media} Media
 * @typedef {import('anki-apkg-export').default} AnkiExport
 */

/**
 * @typedef {Object} Deck
 * @property {string} name
 * @property {Template} template
 * @property {[Card]} cards
 * @property {Object} [options]
 */

class Deck {
  private name: string;
  private options: any;
  private cards: Card[];
  private mediaCollection: any[];
  //   @todo add type
  private template: Template;
  //   @todo add type
  private ankiService: any;
  constructor(name: string, options = {}) {
    this.name = name;
    this.options = options;
    this.cards = [];
    this.mediaCollection = [];
    this.template = new Template();
    this.ankiService = new AnkiExport(this.name, this.template);
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

module.exports = Deck;
