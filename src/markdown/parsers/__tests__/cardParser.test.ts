import assert from "assert";
import { CardParser } from "../cardParser";
import { workspace } from "vscode";
import { Card } from "../../../models/Card";

// Setup mocks for cardParser
jest.mock("vscode");
const config = workspace.getConfiguration as any;
config.mockImplementation(() => ({
  get: jest.fn((val: string) => {
    switch (val) {
      case "card.frontBackSeparator":
        return "%";
      case "card.separator":
        return "(?=^##\\s)";
      case "card.tagPattern":
        return "^\\[#(.*)\\]";
      case "card.createTagForTitle":
        return true;

      default:
        break;
    }
  }),
}));

describe("CardParser", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it("constructs without erroring", () => {
    assert.doesNotThrow(() => {
      new CardParser();
    });
  });

  // Represents a typical use case of simple front and back card
  it("should parse a Markdown input and return a Card instance", async () => {
    const input =
      "## Some text that should be on the front\n\nThis text will be on the back";
    const parser = new CardParser();
    const card = await parser.parse(input);
    expect(card).toBeInstanceOf(Card);
  });

  // Represents a typical use case of simple front and back card
  it("should parse a Markdown input to the correct output", async () => {
    const input =
      "## Some text that should be on the front\n\nThis text will be on the back";
    const parser = new CardParser();
    const card = await parser.parse(input);

    expect(card.question).toBe(
      '<h2 id="some-text-that-should-be-on-the-front">Some text that should be on the front</h2>\n'
    );
    expect(card.answer).toBe("<p>This text will be on the back</p>\n");
  });

  // Similar to the above but with a tag
  it("should parse a Markdown input to the correct output (with tags)", async () => {
    const input =
      "## Some text that should be on the front\n\nThis text will be on the back\n\n[#myTag]()";
    const parser = new CardParser();
    const card = await parser.parse(input);

    expect(card.tags).toContain("myTag");
  });
});
