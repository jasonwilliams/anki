import { MathParser } from "../parsers/mathParser";
import { MdParser } from "../parsers/mdParser";
import { trimArray } from "../../utils";
import { BaseParser } from "./baseParser";

import { Card } from "../../models/Card";

interface ParsedCardLine {
  front: string[];
  back: string[];
  tags: string[];
  isCloze: boolean;
}

/**
 * Parse a string to Card model
 */

export class CardParser extends BaseParser {
  private splitRe: RegExp;
  private tagRe: RegExp;
  private clozeRe: RegExp;

  constructor({ convertToHtml = true } = {}) {
    super({ convertToHtml });
    this.splitRe = new RegExp(
      `^${this.getConfig("card.frontBackSeparator") as string}$`,
      "m"
    );
    this.tagRe = new RegExp(this.getConfig("card.tagPattern") as string);
    this.clozeRe = new RegExp("{{c\\w+::");
  }

  /**
   * Parse a string to Card model
   * @param {string} string Card in string
   * @returns {Promise<Card>}
   */
  async parse(string = ""): Promise<Card> {
    const cardLines = string
      .split(this.splitRe)
      .map((item) => item.split("\n"))
      .map((arr) => arr.map((str) => str.trimRight()));

    const { front, back, tags, isCloze } = this.parseCardLines(cardLines);

    if (!this.options.convertToHtml) {
      return new Card(front.join(), back.join(), tags);
    }

    // If card is a Cloze card we need to use a different note type
    if (isCloze) {
      return new Card(
        front.join().replace("## ", ""),
        back.join(),
        tags,
        "Cloze"
      );
    }

    const frontHtml = await this.linesToHtml(front);
    const backHtml = await this.linesToHtml(back);

    return new Card(frontHtml, backHtml, tags);
  }

  private parseCardLines(cardLines: string[][]): ParsedCardLine {
    const front: string[] = [];
    const back: string[] = [];
    const tags: string[] = [];
    let isCloze = false;

    const fillBackAndTags = (line: string) => {
      // set tags
      if (this.tagRe.test(line)) {
        tags.push(...this.parseTags(line));
        return;
      }

      // set back
      // skip first blank lines
      if (back.length === 0 && !line) {
        return;
      }

      back.push(line);
    };

    if (cardLines.length === 1) {
      trimArray(cardLines[0]).forEach((line: string) => {
        // we should set front first
        if (front.length === 0) {
          // Detect if Cloze syntax is being used on the card title
          if (this.clozeRe.test(line)) {
            isCloze = true;
          }
          front.push(line);
          return;
        }

        fillBackAndTags(line);
      });
    } else {
      // front card has multiple lines
      front.push(...cardLines[0]);

      trimArray(cardLines[1]).forEach((line: string) => fillBackAndTags(line));
    }

    return {
      front: trimArray(front),
      back: trimArray(back),
      tags: trimArray(tags),
      isCloze,
    };
  }

  private parseTags(line: string): string[] {
    const data = line
      .split(" ")
      .map((str) => str.trim())
      .map((str) => {
        const parts = this.tagRe.exec(str);
        return parts?.[1] || "";
      })
      .filter((str) => !!str);

    return data;
  }

  /**
   * Convert card lines to html
   * @param {[string]} lines
   * @returns {Promise<string>}
   * @private
   */
  async linesToHtml(lines: string[]) {
    const string = lines.join("\n");

    const mdString = await new MdParser({}).parse(string);
    return await new MathParser().parse(mdString);
  }
}
