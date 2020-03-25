import { LocationType } from './locationtype';

export class Phone {
  id: number;
  type: LocationType;
  phone: string;

  constructor(id: number, type: LocationType, phone: string) {
    this.id = id;
    this.type = type;
    this.phone = phone;
  }
}
