import { window, workspace } from "vscode";
import { Serializer } from "./Serializer";
import { Deck } from "../models/Deck";
import { AnkiService } from "../AnkiService";
import { Card } from "../models/Card";
import { getLogger } from "../logger";
import { Media } from "../models/Media";
import { MarkdownFile } from "../models/MarkdownFile";
import { SendDiff } from "../models/SendDiff";

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

  async transform(): Promise<SendDiff> {
    return await this.transformToDeck();
  }

  async transformToDeck(): Promise<SendDiff> {
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
    const diff = await this.sendCards(cards);

    // console.log('after diff creation');
    // delete cards from anki that have been deleted from markdown
    // then add cards ids to markdown meta that are verified in Anki
    if (workspace.getConfiguration("anki.send").get("keepSync")) {
      const priorNoteIds = this.source.noteIds;
      // console.log('prior ids', priorNoteIds);
      const currentCards = diff.cardsAdded.concat(diff.cardsUnchanged);
      // console.log('current ids from diff', currentCards);
      // find note ids that are in the existing markdown metadata, but not in the
      // diff of unchanged and added cards. these need to be removed from Anki
      const noteIdsToDelete: number[] = priorNoteIds.filter((oldNoteId) => {
        return !currentCards.some(card => {
          return oldNoteId == card.noteId;
        })
      })
      // console.log('notes to delete', noteIdsToDelete);
      if (noteIdsToDelete.length > 0) {
        await this.ankiService?.deleteNotes(noteIdsToDelete);
        // assume success
        diff.notesDeleted = noteIdsToDelete;
      }      
      // update the metadata or add it
      await this.source.updateMeta(currentCards, true);
    }
    await this.ankiService?.resetUi(); // important to reset the Anki UI afterward because
     // user may be reviewing cards and the card he is on may get deleted
     // then if the user trys to schedule that card, he will get an error
    return diff;
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

  async sendCards(cards: Card[]): Promise<SendDiff> {
    this.addCardsToDeck(cards);
    if (!this.deck) {
      throw new Error("No Deck exists for current cards");
    }
    let allowUpdates: boolean = false;
    if (workspace.getConfiguration("anki.send").get("allowUpdates")) {
      allowUpdates = true;
      
    }
    return await this.deck.updateOrAdd(allowUpdates); 
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
