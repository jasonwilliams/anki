import fetch from "node-fetch";
import { load } from "cheerio";
import { Deck } from "./models/Deck";
import { Card } from "./models/Card";

interface IResponse {
  result: any;
  error: any;
}

export class AnkiService {
  private url: string;
  private version = 6;

  constructor(url: string) {
    this.url = url;
  }

  async invoke(action: string, params?: object): Promise<IResponse> {
    const req = { action, version: this.version, params: { ...params } };
    console.log(JSON.stringify(req));
    const response = await fetch(this.url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
    return jsonResponse;
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

    if (response.error) {
      throw response.error;
    }

    for (const [key, value] of Object.entries(response.result)) {
      const deck = new Deck(key, value as number);
      decks.push(deck);
    }

    return decks;
  }

  async getCardInfo(cards: number[]) {
    const response = await this.invoke("cardsInfo", { cards });
    if (response.error) {
      throw response.error;
    }

    return response;
  }

  async findCards(query: string): Promise<Card[]> {
    // need double quotes for findCard
    // https://github.com/FooSoft/anki-connect/issues/80#issuecomment-394154441
    console.log("sending req");
    const response = await this.invoke("findCards", { query: `${query}` });
    console.log("response: ", response);
    const cards = await this.getCardInfo(response.result);
    console.log("cards: ", cards);

    if (response.error) {
      throw response.error;
    }

    return cards.result.map((v: any) => {
      console.log("sihuhi");
      const $ = load(v.question.toString());
      console.log($("html").text());
      return new Card(v.question, v.answer, v.id);
    });
  }
}
