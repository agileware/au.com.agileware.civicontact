import { Contact } from './contact';

export class Favourite {
  id: number;
  localid: number = 0;
  contactid: number;
  contactidlocal: number = 0;
  contact: Contact;
  isdeleted: number = 0;

  constructor() {
    this.contact = null;
  }
}
