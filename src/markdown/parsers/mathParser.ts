import { BaseParser } from "./baseParser";

export class MathParser extends BaseParser {
  async parse(string = ""): Promise<string> {
    return string
      .replace(/\$\$(.+?)\$\$/g, "\\[$1\\]") // $equation$ -> \(equation\)
      .replace(/\$(.+?)\$/g, "\\($1\\)"); // $$equation$$ -> \[equation\]
  }
}
