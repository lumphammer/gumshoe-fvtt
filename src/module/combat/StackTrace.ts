export class StackTrace extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "\nStackTrace";
  }
}
