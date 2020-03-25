import { Contact } from './contact'

export class CallHistory {
  id: number;
  localid: number = 0;
  activitydatetime: string = "";
  createddate: string = "";
  modifieddate: string = "";
  contactid: number;
  contactidlocal: number = 0;
  duration: number = 0;
  details: string = "";
  contact: Contact;

  constructor() {
    this.contact = null;
  }
}
