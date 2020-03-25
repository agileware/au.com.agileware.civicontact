import { AutoCompleteService } from 'ionic2-auto-complete';
import { Injectable } from "@angular/core";

@Injectable()
export class AddContactPofileAutoCompleteFieldsService implements AutoCompleteService {
  labelAttribute = "val";
  formValueAttribute = "key";

  public autocompleteitems;

  constructor() {
    this.autocompleteitems = [];
  }

  setAutoCompleteExternalItems(items) {
    this.autocompleteitems = [];
    for (let item of items) {
      this.autocompleteitems.push({
        'val': item['val'],
        'key': item['key'],
      });
    }
  }

  getResults(keyword: string) {
    return this.autocompleteitems;
  }
}