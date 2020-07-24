import fetch from "node-fetch";
import { load } from "cheerio";
import { Deck } from "./models/Deck";
import { Card } from "./models/Card";

interface IResponse {
  result: any;
  /** AnkiConnect error, which should always be a string */
  error: string;
}

export class AnkiService {
  private url: string;
  private version = 6;

  constructor(url: string) {
    this.url = url;
  }

  async invoke(action: string, params?: object): Promise<any> {
    const req = { action, version: this.version, params: { ...params } };
    console.log(JSON.stringify(req));
    const response = await fetch(this.url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    const jsonResponse: IResponse = await response.json();

    // Seeing that all responses have an error property, its worth just throwing on it here
    if (jsonResponse.error) {
      throw new Error(jsonResponse.error);
    }

    return jsonResponse.result;
  }

  // https://github.com/FooSoft/anki-connect/blob/master/actions/miscellaneous.md
  /** Synchronizes the local Anki collections with AnkiWeb. */
  async syncGui() {
    await this.invoke("sync");
  }

  /**
   * Get Decks populated with just the names and IDs
   */
  async deckNamesAndIds() {
    const response = await this.invoke("deckNamesAndIds");
    const decks = [];

    for (const [key, value] of Object.entries(response)) {
      const deck = new Deck(key).setId(value as number);
      decks.push(deck);
    }

    return decks;
  }

  async getCardInfo(cards: number[]) {
    const response = await this.invoke("cardsInfo", { cards });

    return response;
  }

  /**
   * Will not overwrite a deck that exists with the same name.
   */
  async createDeck(deckName: string): Promise<number> {
    return await this.invoke("createDeck", {
      deck: deckName,
    });
  }

  async storeMultipleFiles(
    files: { filename: string; url: string }[]
  ): Promise<any> {
    const actions = files.map((v) => ({
      action: "storeMediaFile",
      params: {
        filename: v.filename,
        url: v.url,
      },
    }));

    return await this.invoke("multi", { actions });
  }

  async addNotes(cards: Card[]): Promise<any[]> {
    const notes = cards.map((v) => {
      return {
        deckName: v?.deck?.name || "default",
        modelName: "Basic",
        fields: {
          Front: v.question,
          Back: v.answer,
        },
        tags: v.tags,
      };
    });

    return await this.invoke("addNotes", { notes });
  }

  async findCards(query: string): Promise<Card[]> {
    // need double quotes for findCard
    // https://github.com/FooSoft/anki-connect/issues/80#issuecomment-394154441
    const response = await this.invoke("findCards", { query: `${query}` });
    const cards = await this.getCardInfo(response);

    return cards.result.map((v: any) => {
      const $ = load(v.question.toString());
      return new Card(v.question, v.answer).setId(v.id);
    });
  }
}
