import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocationType } from '../../models/locationtype'
import { DatabaseProvider } from '../../providers/database/database';
import { UtilsProvider } from '../../providers/utils/utils';

/*
  Generated class for the LocationTypesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocationTypesProvider {

  public locationtypes = [];
  public locationtypestoprocess = [];

  constructor(public http: HttpClient, public databaseProvider: DatabaseProvider, public utilsProvider: UtilsProvider) {
    this.locationtypes = [];
    this.locationtypestoprocess = [];
  }

  /**
   * Get information from CiviCRM and save to database
   * @param syncinfo
   */
  fetch(syncinfo) {
    return new Promise(resolve => {

      let postParams = {
        'key': syncinfo.sitekey,
        'api_key': syncinfo.apikey,
        'entity': 'LocationType',
        'action': 'get',
        'json': '{"sequential":1}'
      };

      let resturl = this.utilsProvider.getRestUrl(syncinfo.restendpoint, postParams);
      console.log("Fetching locations from ...");
      console.log(resturl);

      this.http.get(resturl)
        .subscribe(data => {
          if (data["is_error"] == 0) {
            this.map(data["values"]);
            this.databaseProvider.saveLocationTypes(this.locationtypestoprocess);
            this.locationtypes = this.locationtypestoprocess;
            resolve({
              "status": true,
              "locationtypes": this.locationtypestoprocess,
            });
          } else {
            resolve({
              "status": false,
              "message": data["error_message"] + " occurred while fetching location types.",
              "raw_message": data["error_message"]
            });
          }
        }, error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "message": "An error occurred while fetching location types.",
          });
        });
    });
  }

  /**
   * Map data from Civi API to model
   * @param values
   */
  map(values) {
    this.locationtypestoprocess = [];
    for (let value of values) {
      let locationtype = new LocationType();
      locationtype.id = value["id"];
      locationtype.description = value["description"];
      locationtype.displayname = value["display_name"];
      locationtype.isdefault = (value["is_default"]) ? 1 : 0;
      locationtype.name = value["name"];
      locationtype.vcardname = value["vcard_name"];
      this.locationtypestoprocess.push(locationtype);
    }
  }

  retrive() {
    return new Promise(resolve => {
      this.databaseProvider.findAllLocationType().then((retrivedlocationtypes) => {
        this.locationtypes = <Array<LocationType>>retrivedlocationtypes;
        resolve(this.locationtypes);
      });
    })
  }

  getLocationType(id: number) {
    let totaltypes = this.locationtypes.length;
    for (let i = 0; i < totaltypes; i++) {
      if (this.locationtypes[i].id == id) {
        return this.locationtypes[i];
      }
    }

    return null;
  }
}
