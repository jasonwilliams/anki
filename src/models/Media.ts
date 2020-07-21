import { createHash } from "crypto";

class Media {
  private data: any;
  //   private filename: string;

  constructor(data: any, fileName: string) {
    this.data = data;
    // this.fileName = fileName;
  }

  /**
   * @returns {string} File data digest
   */
  get checksum() {
    return createHash("md5").update(this.data, "utf8").digest("hex");
  }
}

module.exports = Media;
