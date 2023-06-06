import { dirname, relative } from "path";
import { Position, window, workspace } from "vscode";
import { IContext } from "../extension";
import { Card } from "../models/Card";
import { Deck } from "../models/Deck";
import { MarkdownFile } from "../models/MarkdownFile";
import { Media } from "../models/Media";
import { SendDiff } from "../models/SendDiff";
import { DeckNameStrategy, Serializer } from "./Serializer";
import { load } from "cheerio";
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from "node-html-markdown";

/**
 * Create anki cards from markdown files
 */
export class Transformer {
  private source: MarkdownFile;
  private deck: Deck | null;
  private defaultDeck: string;
  private strategy: DeckNameStrategy;
  private context: IContext;

  /**
   * @param {string} source markdown file
   * @param {DeckNameStrategy} strategy how to get the deck name
   */
  constructor(source: MarkdownFile, ctx: IContext, strategy: DeckNameStrategy = DeckNameStrategy.UseDefault) {
    this.deck = null;
    this.source = source;
    this.context = ctx;
    this.strategy = strategy;
    this.defaultDeck = workspace.getConfiguration("anki").get("defaultDeck") as string;
  }

  async transform(): Promise<SendDiff> {
    return await this.transformToDeck();
  }

  async transformToDeck(): Promise<SendDiff> {
    const serializer = new Serializer(this.source, this.strategy, this.context);

    const { cards, deckName, media } = await serializer.transform();

    if (!cards.length) {
      throw new Error("No cards found. Check your markdown file");
    }

    this.deck = new Deck(this.calculateDeckName(deckName)).setAnkiService(this.context.ankiService);

    // If strategy is UseDefault then the title will be the default Deck
    // For daily markdown files it's still useful to have a tag (we can use the title for this)
    if (
      deckName &&
      this.strategy === DeckNameStrategy.UseDefault &&
      (workspace.getConfiguration("anki.md").get("createTagForTitle") as boolean)
    ) {
      cards.forEach((v) => v.addTag(deckName));
    }

    // Either create a new Deck on Anki or get back the ID of the same-named Deck
    await this.deck.createOnAnki();
    await this.pushMediaItems(media);
    // this.exportCards will return a list of Cards that were just created. Thus we need to insert their note IDs into the markdown
    const newCards = await this.exportCards(cards);
    // Call to insert noteID into markdown
    this.insertNoteIDs(newCards);

    return new SendDiff(); // dummy return for the first pull request
  }

  private getConfig(conf: string) {
    return workspace.getConfiguration("anki.md").get(conf);
  }

  insertNoteIDs(cards: Card[]) {
    let lines = this.source.cachedContent.split("\n");
    let match = new RegExp(this.getConfig("card.separator") as string);

    // https://stackoverflow.com/questions/6946466/line-number-of-the-matched-characters-in-js-node-js
    let headerLineNumbers: number[] = [];
    lines.map((element, index) => {
      if (match.exec(element)) {
        headerLineNumbers.push(index);
      }
    });

    // Now need to correlate the header lines with which card they match
    // I have to have a line number such that I can create a position
    // https://code.visualstudio.com/api/references/vscode-api#Position
    // https://code.visualstudio.com/api/references/vscode-api#TextEditorEdit

    // https://codereview.stackexchange.com/questions/153691/escape-user-input-for-use-in-js-regex
    function escapeRegExp(string: string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }

    // For each of the indexes, try and match one of the card fronts
    const nhm = new NodeHtmlMarkdown();
    let lineIndexToNoteID = new Map();
    headerLineNumbers.forEach((lineIndex) => {
      cards.forEach((card) => {
        let front = nhm.translate(card.question);
        let matchFront = new RegExp(`^##\\s+${escapeRegExp(front)}\\s*$`, "m");
        let matched = matchFront.exec(lines[lineIndex]);

        if (matched) {
          lineIndexToNoteID.set(lineIndex, card.noteId);
        }
      });
    });

    // https://github.com/microsoft/vscode-extension-samples/blob/main/document-editing-sample/src/extension.ts
    const editor = window.activeTextEditor;
    editor?.edit((editBuilder) => {
      for (let [lineIndex, noteID] of lineIndexToNoteID.entries()) {
        editBuilder.insert(new Position(lineIndex + 1, 0), `\n<!-- notecardId: ${noteID} -->\n`);
      }
    });
  }

  async pushMediaItems(media: Media[]) {
    if (!media.length) {
      return;
    }

    const files = media.map((v) => ({
      filename: v.fileName,
      data: v.data,
    }));

    await this.context.ankiService.storeMultipleFiles(files);
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
        deckName = relative(rootPath, dirname(filePath)).replace(/[\/\\]/g, "::");
      }
      return deckName || this.defaultDeck;
    }
  }

  async exportCards(cards: Card[]): Promise<Card[]> {
    this.addCardsToDeck(cards);
    if (!this.deck) {
      throw new Error("No Deck exists for current cards");
    }

    return await this.deck.createAndUpdateCards();
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
