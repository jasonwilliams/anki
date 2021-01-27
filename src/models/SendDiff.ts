import { Card } from "./Card";


// represents changes that occured on send
export class SendDiff {
    cardsUnchanged: Card[] = [];
    cardsDeleted: Card[] = [];
    cardsAdded: Card[] = [];
}