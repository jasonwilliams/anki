import { Deck } from "./models/Deck";

let _ankiState: any;
let _initialised = false;

_ankiState = {};

/**
 * We need to do some actions which can be quite intensive if constantly going back and forth
 * between AnkiConnect and here. So our state basically acts as a cache
 */
class AnkiState {
  private decks: Deck[] = [];

  // Do we already have this deck in our cache?
  private deckExists(id: string) {
    return this.decks.some((v) => v.id?.toString() === id);
  }

  /**
   *  Convert the deck ID into a deck name.
   * `null` is returned if ID cannot be found
   */
  getDeckNameFromId(id: number): string | null {
    return this.decks.reduce((acc: string | null, deck: Deck) => {
      if (deck.id && deck.id === id) {
        return deck.name;
      }
      return acc;
    }, null);
  }

  /**
   *  Convert the deck name into an ID
   * `null` is returned if name cannot be found
   */
  getDeckIDFromName(name: string): number | null {
    return this.decks.reduce((acc: number | null, deck: Deck) => {
      if (deck.name === name) {
        return deck.id ?? null;
      }
      return acc;
    }, null);
  }

  getDeckFromName(name: string): Deck | null {
    return this.decks.find((deck: Deck) => deck.name === name) ?? null;
  }

  /**
   * Decks are only added if id exists as a property
   * @param decks Decks to add
   */
  addDecks(decks: Deck[]) {
    decks.forEach((v) => {
      // For now if the deck exists don't do anything
      // Comparison is only possible if the deck has an ID
      if (v.id && !this.deckExists(v.id.toString())) {
        this.decks.push(v);
      }
    });
  }
}

export const initState = () => {
  _initialised = true;
  _ankiState = new AnkiState();
};

export const getAnkiState = (): AnkiState => {
  if (!_initialised) {
    throw new Error("Anki State not initialised");
  }

  return _ankiState;
};
