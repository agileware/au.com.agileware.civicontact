import { LocationType } from './locationtype';

export class Email {
  id: number;
  type: LocationType;
  email: string;

  constructor(id: number, type: LocationType, email: string) {
    this.id = id;
    this.type = type;
    this.email = email;
  }
}
