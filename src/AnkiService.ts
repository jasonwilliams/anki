import { load } from "cheerio";
import fetch from "node-fetch";
import { getLogger } from "./logger";
import { Model } from "./manageTemplate";
import { Card } from "./models/Card";
import { Deck } from "./models/Deck";
import { getAnkiState } from "./state";

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
    getLogger().trace(JSON.stringify(req));
    const response = await fetch(this.url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    const jsonResponse: IResponse = (await response.json()) as IResponse;

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

    // Add the decks into our state
    getAnkiState().addDecks(decks);
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

  async storeMultipleFiles(files: { filename: string; data: string }[]): Promise<any> {
    const actions = files.map((v) => ({
      action: "storeMediaFile",
      params: {
        filename: v.filename,
        data: v.data,
      },
    }));

    return await this.invoke("multi", { actions });
  }

  async createModel(model: any) {
    return await this.invoke("createModel", model);
  }

  async modelNames(): Promise<string[]> {
    return await this.invoke("modelNames");
  }

  async modelStyling(modelName: string) {
    return await this.invoke("modelStyling", { modelName });
  }

  async modelNamesAndIds(): Promise<{ [key: string]: number }> {
    return await this.invoke("modelNamesAndIds");
  }

  async modelTemplates(modelName: string): Promise<object> {
    return await this.invoke("modelTemplates", { modelName });
  }
  async updateModelTemplate(model: Model) {
    return await this.invoke("updateModelTemplates", {
      model: {
        name: model.modelName,
        templates: model.cardTemplates.reduce((acc, v) => {
          (acc as any)[v.Name] = { Front: v.Front, Back: v.Back };
          return acc;
        }, {}),
      },
    });
  }

  async addNotes(cards: Card[]): Promise<any[]> {
    const notes = cards.map((v) => {
      return {
        deckName: v?.deck?.name || "default",
        modelName: v.modelName,
        options: {
          allowDuplicate: false,
          duplicateScope: "deck",
        },
        fields: v.fields,
        tags: v.tags,
      };
    });

    return await this.invoke("addNotes", { notes });
  }

  async guiDeckBrowser(): Promise<any[]> {
    return await this.invoke("guiDeckBrowser");
  }

  // seems to return { result: null, error: null } from the doc so I'm not sure how to confirm card deletion
  async deleteNotes(notes: number[]): Promise<any[]> {
    return await this.invoke("deleteNotes", {
      notes: notes,
    });
  }

  async findCards(query: string): Promise<Card[]> {
    // need double quotes for findCard
    // https://github.com/FooSoft/anki-connect/issues/80#issuecomment-394154441
    const response = await this.invoke("findCards", { query: `${query}` });
    const cards = await this.getCardInfo(response);

    return cards.map((v: any) => {
      let $ = load(v.question.toString());
      const cleanQuestion = $("html").text();
      $ = load(v.answer.toString());
      const cleanAnswer = $("html").text();
      const newCard = new Card(cleanQuestion, cleanAnswer, undefined, undefined, v.modelName)
        .setNoteId(v.note)
        .setFields(v.fields)
        .setDeckName(v.deckName);

      // If the card's deck exists in our state, add our card into it the deck
      // Don't add if it's already there
      const deck = getAnkiState().getDeckFromName(v.deckName);
      if (deck && !deck.hasCard(v.cardId)) {
        deck.addCard(newCard);
      }

      return newCard;
    });
  }

  // Is Anki running?
  async isUp(): Promise<boolean> {
    try {
      // There's no native "isUp" function but modelNames is a safe
      await this.modelNames();
    } catch (e) {
      return false;
    }

    return true;
  }
}
