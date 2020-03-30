import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Favourite } from '../../models/favourite';
import { ContactsProvider } from '../../providers/contacts/contacts';
import { DatabaseProvider } from '../../providers/database/database';
import { UtilsProvider } from '../../providers/utils/utils';
import { Contact } from '../../models/contact';

/*
  Generated class for the FavouritesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class FavouritesProvider {

  public favourites: Favourite[];

  constructor(public http: HttpClient, public contactsprovider: ContactsProvider, private databaseProvider: DatabaseProvider,
    public utilsProvider: UtilsProvider) {
    this.favourites = new Array<Favourite>();
  }

  fetch(syncinfo) {
    return new Promise(resolve => {

      let modifiedparam = "";
      if (syncinfo.lastpulldatetime != "") {
        modifiedparam = '"modified_date":{">=":"' + syncinfo.lastpulldatetime + '"},';
      }

      let formData = new FormData();
      formData.append('key', syncinfo.sitekey);
      formData.append('api_key', syncinfo.apikey);
      formData.append('entity', 'relationship');
      formData.append('action', 'favourites');
      formData.append('sequential', '1');
      formData.append('contact_id', syncinfo.contactid);
      formData.append('json', '1');

      let headers = new HttpHeaders();
      headers.append('content-type', 'multipart/form-data');

      this.http.post(syncinfo.restendpoint, formData, { headers: headers })
        .subscribe(data => {
          if (data["is_error"] == 0) {
            let timestamp = data["timestamp"];
            this.favourites = new Array<Favourite>();
            this.map(data["values"]).then((data) => {
              this.databaseProvider.saveFavourites(this.favourites).then((data) => {
                resolve({
                  "favourites": this.favourites,
                  "timestamp": timestamp,
                  "status": true,
                });
              });
            });
          } else {
            resolve({
              "favourites": [],
              "timestamp": "",
              "status": false,
              "message": data["error_message"] + " occured while fetching favourites.",
            });
          }
        }, error => {
          console.log(JSON.stringify(error));
          resolve({
            "favourites": [],
            "timestamp": "",
            "status": false,
            "message": "An error occurred while fetching favourites.",
          });
        });
    });
  }

  reterive() {
    return new Promise(resolve => {
      this.databaseProvider.getFavourites().then((favourites) => {
        this.favourites = <Array<Favourite>>favourites;
        resolve({
          'favourites': favourites
        });
      });
    });
  }

  search(searchterm) {
    return new Promise((resolve) => {
      this.databaseProvider.getFavourites(searchterm).then((favourites) => {
        resolve(favourites);
      });
    });
  }

  map(values) {
    return new Promise(resolve => {
      if (values.length == 0) {
        resolve();
      }

      let totalprocessed = 0;
      for (let value of values) {
        let contactid = value["contact_id_b"];
        let favourite = new Favourite();
        favourite.contactid = contactid;
        favourite.id = value["id"];
        this.contactsprovider.markContactAsFavourite(contactid).then((contact) => {
          totalprocessed++;
          if (contact != null) {
            favourite.contact = <Contact>contact;
            this.favourites.push(favourite);
          }
          if (totalprocessed == values.length) {
            resolve();
          }
        });
      }
    });
  }

  unFavouriteContact(favouriteid, isByContact = false) {
    return new Promise(resolve => {
      this.databaseProvider.unFavouriteContact(favouriteid, isByContact).then((data) => {
        resolve(data);
      });
    });
  }

}
