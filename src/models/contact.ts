import { Email } from './email';
import { Phone } from './phone';
import { Colors } from './colors';
import { Profilefielddata } from "./profilefielddata";

export class Contact {
  public id: number;
  public localid: number = 0;
  public imageurl: string;
  public firstname: string;
  public lastname: string;
  public sortname: string;
  public createddate: string;
  public modifieddate: string;
  public phones: Phone[];
  public emails: Email[];
  public isfavourite: number = 0;
  public isdeleted: number = 0;
  public colorclass: string;
  public groups: string;
  public action: string = "create";
  public profilefieldsdata: Profilefielddata[];

  constructor() {
    this.phones = new Array<Phone>();
    this.emails = new Array<Email>();
    this.colorclass = Colors.getRandom();
    this.profilefieldsdata = new Array<Profilefielddata>();
  }

  getDisplayName() {
    return this.firstname + " " + this.lastname;
  }
}
