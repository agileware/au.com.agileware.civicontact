import { County } from "./county";

export class State {
  id: number;
  name: string;
  counties: County[];

  constructor() {
    this.counties = new Array<County>();
  }
}