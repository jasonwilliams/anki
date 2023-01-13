import assert from "assert";
import { DeckNameStrategy, Serializer } from "../Serializer";
import { Uri, workspace } from "vscode";
import { MarkdownFile } from "../../models/MarkdownFile";

describe("Serializer", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });
  it("constructs without erroring", () => {
    assert.doesNotThrow(() => {
      new Serializer(new MarkdownFile(null), DeckNameStrategy.ParseTitle);
    });
  });
  describe("deckName", () => {
    beforeAll(() => {
      const getConfig = jest.spyOn(Serializer.prototype as any, "getConfig");
      // force the getConfig to return back the default value for deck.titleSeparator
      // As that is the only config we're using in deckName
      getConfig.mockImplementation((conf) => "^#\\s");
    });

    it("should strip out any front matter before getting the title", () => {
      // Arrange
      const deckName = "Test Title";
      const input = [
        `Some Random Front Matter\r\n# ${deckName}\r\n`,
        "## Some Card\r\nCard text",
      ];
      const serializer = new Serializer(
        new MarkdownFile(null),
        DeckNameStrategy.ParseTitle
      );
      // Act
      const result = serializer.deckName(input);
      // Assert
      expect(result).toEqual(deckName);
    });
    it("should only receive the title from the line of the h1 accounting for CRLF line endings", () => {
      // Arrange
      const deckName = "Test Title";
      const input = [
        `# ${deckName}\r\n\r\nextra stuff before the card`,
        "## Some Card\r\nCard text",
      ];
      const serializer = new Serializer(
        new MarkdownFile(null),
        DeckNameStrategy.ParseTitle
      );
      // Act
      const result = serializer.deckName(input);
      // Assert
      expect(result).toEqual(deckName);
    });
    it("should only receive the title from the line of the h1 accounting for LF line endings", () => {
      // Arrange
      const deckName = "Test Title";
      const input = [
        `# ${deckName}\n\nextra stuff before the card`,
        "## Some Card\nCard text",
      ];
      const serializer = new Serializer(
        new MarkdownFile(null),
        DeckNameStrategy.ParseTitle
      );
      // Act
      const result = serializer.deckName(input);
      // Assert
      expect(result).toEqual(deckName);
    });
    it("should only receive the title from the line of the h1 accounting for weird mac line endings", () => {
      // Arrange
      const deckName = "Test Title";
      const input = [
        `# ${deckName}\r\rextra stuff before the card`,
        "## Some Card\rCard text",
      ];
      const serializer = new Serializer(
        new MarkdownFile(null),
        DeckNameStrategy.ParseTitle
      );
      // Act
      const result = serializer.deckName(input);
      // Assert
      expect(result).toEqual(deckName);
    });
  });
});
