/* eslint-disable no-param-reassign */
import { workspace } from "vscode";

import { Card } from "../models/Card";
import { CardParser } from "./parsers/cardParser";
import { getLogger } from "../logger";
import { Media } from "../models/Media";
import path from "path";
import fs from "fs";
import { MarkdownFile } from "../models/MarkdownFile";
import { isRemoteLink } from "../utils";

export const enum DeckNameStrategy {
  UseDefault,
  ParseTitle,
  ParseDirStru,
}

interface ParsedData {
  /** DeckName can be null in which case we use the defaultDeck */
  deckName: string | null;
  cards: Card[];
  media: Media[];
}

export class Serializer {
  private source: MarkdownFile;
  private strategy: DeckNameStrategy;

  public constructor(source: MarkdownFile, strategy: DeckNameStrategy) {
    this.source = source;
    this.strategy = strategy;
  }

  public async transform(): Promise<ParsedData> {
    const content = this.source.cachedContent;
    return await this.splitByCards(content);
  }

  private getConfig(conf: string) {
    return workspace.getConfiguration("anki.md").get(conf);
  }

  private async splitByCards(mdString: string): Promise<ParsedData> {
    let rawCards = mdString
      .split(new RegExp(this.getConfig("card.separator") as string, "m"))
      .map((line) => line.trim());

    const deckName = this.deckName(rawCards);
    const convertMath = this.getConfig("card.convertMath") as boolean;

    // If we call "send to own deck" we need the title, if we don't have it error out here
    if (!deckName && this.strategy === DeckNameStrategy.ParseTitle) {
      getLogger().error(
        "Serializer: Could not find H1 title in this document!"
      );
      throw new Error("Unable to parse title!");
    }

    // filter out deck title
    rawCards = rawCards.filter(
      (str) =>
        str.search(this.getConfig("deck.titleSeparator") as string) === -1
    );

    const parsedCards = await Promise.all(
      rawCards.map((str) => new CardParser({ convertMath }).parse(str))
    );
    const cards = parsedCards
      // card should have at least a front side
      // Cloze cards don't need an answer side
      .filter((card) => card?.question);

    // get media from markdown file
    const media = this.mediaFromCards(cards);

    return {
      deckName,
      cards,
      media,
    };
  }

  deckName(rawCards: string[]): string | null {
    const deckName = rawCards.reduce((acc, str) => {
      const match = str.match(
        new RegExp(this.getConfig("deck.titleSeparator") as string, "m")
      );

      if (match && match.input) {
        // Handle frontmatter
        // There could be frontmatter in this string, we need to slice it out, we can get the index of where the match happened and remove everything before
        let cleanedDeckName = match.input.slice(match.index);

        // Remove anything after a new line of the deck name
        return cleanedDeckName.replace(/(\r\n|\r|\n)+.+/gm, "");
      }

      return acc;
    }, "");

    if (!deckName) {
      return null;
    }

    return deckName.replace(/(#\s|\r\n|\r|\n)/g, "");
  }

  /**
   * Search media in cards and add it to the media collection
   */
  private mediaFromCards(cards: Card[]) {
    const mediaList: Media[] = [];

    cards.forEach((card) => {
      card.setQuestion(this.prepareMediaForSide(card.question, mediaList));
      card.setAnswer(this.prepareMediaForSide(card.answer, mediaList));
    });

    return mediaList;
  }

  /**
   * Prepare media from card's and prepare it for using
   * @param {string} side
   * @param {[Media]} mediaList
   * @private
   */
  prepareMediaForSide(side: string, mediaList: Media[]) {
    const pattern = /src="([^"]*?)"/g;

    const prepare = (_: string, p1: string) => {
      // If it is a remote media resource, do not upload it to anki web
      if(isRemoteLink(p1)) {
        return `src="${decodeURIComponent(p1)}"`;
      }

      const filePath = path.resolve(
        this.source.dirPath() ?? "", // get media relative to current file instead
        decodeURIComponent(p1)
      );

      const fileExt = path.extname(filePath);

      const data = fs.readFileSync(filePath, {
        encoding: "base64",
      });
      const media = new Media(data);

      media.fileName = `${media.checksum}${fileExt}`;

      const hasMedia = mediaList.some(
        (item) => item.checksum === media.checksum
      );
      if (!hasMedia) {
        mediaList.push(media);
      }

      return `src="${media.fileName}"`;
    };

    return side.replace(pattern, prepare);
  }
}
