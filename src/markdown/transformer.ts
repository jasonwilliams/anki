import { window, workspace } from "vscode";
import { Serializer } from "./Serializer";
import { Deck } from "../models/Deck";
import { AnkiService } from "../AnkiService";
import { Card } from "../models/Card";
import { getLogger } from "../logger";
import { Media } from "../models/Media";
import { MarkdownFile } from "../models/MarkdownFile";

/**
 * Create anki cards from markdown files
 */
export class Transformer {
  private source: MarkdownFile;
  private deck: Deck | null;
  private defaultDeck: string;
  private useDefault: boolean;
  private ankiService: AnkiService;

  /**
   * @param {string} source markdown file
   * @param {string} useDefault Whether to send to default deck or not
   */
  constructor(
    source: MarkdownFile,
    ankiService: AnkiService,
    useDefault: boolean = true
  ) {
    this.deck = null;
    this.source = source;
    this.ankiService = ankiService;
    this.useDefault = useDefault;
    this.defaultDeck = workspace
      .getConfiguration("anki")
      .get("defaultDeck") as string;
  }

  async transform() {
    await this.transformToDeck();
  }

  async transformToDeck() {
    const serializer = new Serializer(this.source, this.useDefault);

    const { cards, deckName, media } = await serializer.transform();

    if (!cards.length) {
      throw new Error("No cards found. Check your markdown file");
    }

    this.deck = new Deck(this.calculateDeckName(deckName)).setAnkiService(
      this.ankiService
    );

    // If useDefault is true then the title will be the default Deck
    // For daily markdown files it's still useful to have a tag (we can use the title for this)
    if (
      deckName &&
      this.useDefault &&
      (workspace
        .getConfiguration("anki.md")
        .get("createTagForTitle") as boolean)
    ) {
      cards.forEach((v) => v.addTag(deckName));
    }

    // Either create a new Deck on Anki or get back the ID of the same-named Deck
    await this.deck.createOnAnki();
    await this.pushMediaItems(media);
    await this.exportCards(cards);
  }

  async pushMediaItems(media: Media[]) {
    if (!media.length) {
      return;
    }

    const files = media.map((v) => ({
      filename: v.fileName,
      data: v.data,
    }));

    await this.ankiService.storeMultipleFiles(files);
  }

  calculateDeckName(generatedName: string | null = null): string {
    return this.useDefault
      ? this.defaultDeck
      : generatedName || this.defaultDeck;
  }

  async exportCards(cards: Card[]) {
    this.addCardsToDeck(cards);
    if (!this.deck) {
      throw new Error("No Deck exists for current cards");
    }

    await this.deck.pushNewCardsToAnki();
  }

  addCardsToDeck(cards: Card[]) {
    cards.forEach((card: Card) => {
      if (!this.deck) {
        throw new Error("No Deck exists for current cards");
      }

      this.deck.addCard(card);
    });
  }
}
