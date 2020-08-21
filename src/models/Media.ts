import { createHash } from "crypto";

export class Media {
  public data: any;
  public fileName: string = "";

  constructor(data: any) {
    this.data = data;
  }

  /**
   * @returns {string} File data digest
   */
  get checksum() {
    return createHash("md5").update(this.data, "utf8").digest("hex");
  }
}
