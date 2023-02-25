import { Card } from "./Card";

// represents changes that occured on send
export class SendDiff {
  cardsUnchanged: Card[] = [];
  cardsDeleted: Card[] = [];
  cardsAdded: Card[] = [];
  notesDeleted: Number[] = [];

  toString(): string {
    return (
      `Cards added: ${this.cardsAdded.length}; Cards Unchanged: ${this.cardsUnchanged.length}; ` +
      `Cards Deleted: ${this.cardsDeleted.length}; Notes Deleted: ${this.notesDeleted.length}`
    );
  }

  public static combine(diffs: SendDiff[]): SendDiff {
    const diff = new SendDiff();
    diff.cardsAdded = diffs.reduce((acc: Card[], diff) => acc.concat(diff.cardsAdded), []);
    diff.cardsUnchanged = diffs.reduce((acc: Card[], diff) => acc.concat(diff.cardsUnchanged), []);
    diff.cardsDeleted = diffs.reduce((acc: Card[], diff) => acc.concat(diff.cardsDeleted), []);
    diff.notesDeleted = diffs.reduce((acc: Number[], diff) => acc.concat(diff.notesDeleted), []);
    return diff;
  }
}
