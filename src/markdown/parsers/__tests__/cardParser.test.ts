import assert from "assert";
import { CardParser } from "../cardParser";
import { Card } from "../../../models/Card";

// Setup mocks for cardParser
jest.mock("vscode");

describe("CardParser", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });
 describe("Good Input", () => {
    it("constructs without erroring", () => {
      assert.doesNotThrow(() => {
        new CardParser();
      });
    });

    // Handling math parsing
    it("should convert math strings correctly", async () => {
      const input =
        "## Equation\n\n%\n\n$x_1 = 1$, $x_2 = 2$, $$x_3 = 3$$, $$x_4 = 4$$";
      const parser = new CardParser();
      const card = await parser.parse(input);
      expect(card.question).toBe('<h2 id="equation">Equation</h2>\n');
      expect(card.answer).toBe(
        "<p>\\(x_1 = 1\\), \\(x_2 = 2\\), \\[x_3 = 3\\], \\[x_4 = 4\\]</p>\n"
      );
    });

    // Represents a typical use case of simple front and back card
    it("should parse a Markdown input and return a Card instance", async () => {
      const input =
        "## Some text that should be on the front\n\nThis text will be on the back";
      const parser = new CardParser({ convertMath: true });
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

    it("should parse % to enable an extended question", async () => {
      const input =
        "## Some text that should be on the front\n\nThis text will be still be on the front\n\n%\n\nThis text will be on the back";
      const parser = new CardParser();
      const card = await parser.parse(input);

      expect(card.question).toBe(
        '<h2 id="some-text-that-should-be-on-the-front">Some text that should be on the front</h2>\n<p>This text will be still be on the front</p>\n'
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

    // Should parse the note ID properly
    it("should parse the note ID properly", async () => {
        const input =
          "## Some text that should be on the front\n\n<!-- notecardId: 123 -->\nThis text will be on the back\n\n[#myTag]()";
        const parser = new CardParser();
        const card = await parser.parse(input);

        expect(card.noteId).toBe(123);
        expect(card.answer).toBe("<p>This text will be on the back</p>\n");
      });
  });

  describe("Bad Input", () => {
    // Card Parser splits by \n
    it("should handle a H1 and just split by new line", async () => {
      const input =
        "# Some text that should be on the front\n\nThis text will be on the back";
      const parser = new CardParser();
      const card = await parser.parse(input);

      expect(card.question).toBe(
        '<h1 id="some-text-that-should-be-on-the-front">Some text that should be on the front</h1>\n'
      );
      expect(card.answer).toBe("<p>This text will be on the back</p>\n");
    });
  });
});
