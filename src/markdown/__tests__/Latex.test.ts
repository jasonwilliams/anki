import { CardParser } from "../parsers/cardParser";

describe("Latex", () => {
  it("Should keep the content of 'Latex inline' unchanged.", async () => {
    // linesToHtml always return a newline at the end of string
    const latexs = ["a=\\%1", "b=\\#1"];
    const input = [
      `extra stuff before the latex`,
      `extra stuff before the latex $${latexs[0]}$ extra stuff after the latex`,
      `$${latexs[1]}$`,
      `extra stuff after the latex`
    ];
    const cardParser = new CardParser();
    // Act 
    const result = await cardParser.linesToHtml(input);
    // Assert
    for (let latex of latexs) {
      expect(result).toMatch(latex);
    }
  });
  it("Should keep the content of 'Latex block' unchanged.", async () => {
    // linesToHtml always return a newline at the end of string
    const latexs = ["a=\\%1", "b=\\#1",
      "\\before{align}", "c=\\{1,2\\} \\\\", "d=\\$2", "\\end{align}"];
    const input = [
      `extra stuff before the latex`,
      `$$${latexs[0]} ${latexs[1]}$$`,  // one line latex block
      `extra stuff`,
      `$$`,                             // multiline latex block
      `${latexs[2]}`,
      `${latexs[3]}`,
      `${latexs[4]}`,
      `${latexs[5]}`,
      `$$`
    ];
    const cardParser = new CardParser();
    // Act 
    const result = await cardParser.linesToHtml(input);
    // Assert
    for (let latex of latexs) {
      expect(result).toMatch(latex);
    }
  });
  it("Should not affect the conversion outside of latex", async () => {
    const htmlStr = "<p>%</p>\n";
    const input = [
      "\\%"
    ];
    const cardParser = new CardParser();
    // Act
    const result = (await cardParser.linesToHtml(input));
    // Assert
    expect(result).toEqual(htmlStr);
  });
});
