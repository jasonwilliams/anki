import { window, workspace } from "vscode";
import { DeckNameStrategy, Serializer } from "./Serializer";
import { Deck } from "../models/Deck";
import { AnkiService } from "../AnkiService";
import { Card } from "../models/Card";
import { getLogger } from "../logger";
import { Media } from "../models/Media";
import { MarkdownFile } from "../models/MarkdownFile";
import { SendDiff } from "../models/SendDiff";
import { relative, dirname } from "path";

/**
 * Create anki cards from markdown files
 */
export class Transformer {
  private source: MarkdownFile;
  private deck: Deck | null;
  private defaultDeck: string;
  private strategy: DeckNameStrategy;
  private ankiService: AnkiService;

  /**
   * @param {string} source markdown file
   * @param {DeckNameStrategy} strategy how to get the deck name
   */
  constructor(
    source: MarkdownFile,
    ankiService: AnkiService,
    strategy: DeckNameStrategy = DeckNameStrategy.UseDefault
  ) {
    this.deck = null;
    this.source = source;
    this.ankiService = ankiService;
    this.strategy = strategy;
    this.defaultDeck = workspace
      .getConfiguration("anki")
      .get("defaultDeck") as string;
  }

  async transform(): Promise<SendDiff> {
    return await this.transformToDeck();
  }

  async transformToDeck(): Promise<SendDiff> {
    const serializer = new Serializer(this.source, this.strategy);

    const { cards, deckName, media } = await serializer.transform();

    if (!cards.length) {
      throw new Error("No cards found. Check your markdown file");
    }

    this.deck = new Deck(this.calculateDeckName(deckName)).setAnkiService(
      this.ankiService
    );

    // If strategy is UseDefault then the title will be the default Deck
    // For daily markdown files it's still useful to have a tag (we can use the title for this)
    if (
      deckName &&
      this.strategy === DeckNameStrategy.UseDefault &&
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

    return new SendDiff(); // dummy return for the first pull request
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
    if (this.strategy === DeckNameStrategy.UseDefault) {
      return this.defaultDeck;
    } else if (this.strategy === DeckNameStrategy.ParseTitle) {
      return generatedName || this.defaultDeck;
    } else {
      const fileUri = window.activeTextEditor?.document.uri;
      if (fileUri === undefined) {
        return this.defaultDeck;
      }
      const rootPath = workspace.getWorkspaceFolder(fileUri)?.uri.path;
      const filePath = fileUri.path;
      let deckName: string = "";
      if (rootPath && filePath) {
        deckName = relative(rootPath, dirname(filePath)).replace(/[\/\\]/g, '::');
      }
      return deckName || this.defaultDeck;
    }
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
