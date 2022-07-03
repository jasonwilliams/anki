import { BaseParser } from "./baseParser";

export class MathParser extends BaseParser {
  async parse(string = ""): Promise<string> {
    // (?<!\\):  $100\$$->\(100\$\)
    return string
      .replace(/(?<!\\)\$\$(.+?)(?<!\\)\$\$/g, "\\[$1\\]") // $$equation$$ -> \[equation\]
      .replace(/(?<!\\)\$(.+?)(?<!\\)\$/g, "\\($1\\)"); // $equation$ -> \(equation\)
  }
}
