export class Colors {
  private static colors = ["red", "pink", "purple", "deep-purple", "indigo", "blue", "cyan", "teal", "deep-orange", "brown", "grey", "blue-grey"];

  static getRandom() {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }
}
