import { State } from "./state";

export class Country {
  id: number;
  name: string;
  isoCode: string;
  states: State[];

  constructor() {
    this.states = new Array<State>();
  }
}