const { question: defaultQuestion, answer: defaultAnswer, css: defaultCss } = require("../configs").template.formats;

class Template {
  private questionFormat: string;
  private answerFormat: string;
  private css: string;

  constructor(questionFormat?: string, answerFormat?: string, css?: string) {
    this.questionFormat = questionFormat || defaultQuestion;
    this.answerFormat = answerFormat || defaultAnswer;
    this.css = css || defaultCss;
  }
}
