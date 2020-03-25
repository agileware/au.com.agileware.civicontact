import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UtilsProvider } from "../utils/utils";
import { DatabaseProvider } from "../database/database";

/*
  Generated class for the CountriesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class CountriesProvider {

  constructor(public http: HttpClient, private utilsProvider: UtilsProvider, private databaseProvider: DatabaseProvider) {

  }

  fetch(syncinfo) {
    return new Promise(resolve => {

      let formData = new FormData();
      formData.append('key', syncinfo.sitekey);
      formData.append('api_key', syncinfo.apikey);
      formData.append('entity', 'Country');
      formData.append('action', 'getwithstates');
      formData.append('json', '{}');

      let headers = new HttpHeaders();
      headers.append('content-type', 'multipart/form-data');

      let resturl = syncinfo.restendpoint;

      console.log("Fetching countries from ...");
      console.log(resturl);

      this.http.post(resturl, formData, { headers: headers })
        .subscribe(data => {
          console.log("countries fetched...");

          if (data["is_error"] == 0) {
            let countryvalues = data["values"];
            this.databaseProvider.updateCountries(countryvalues).then((data) => {
              if (!data["status"]) {
                this.resolveError(resolve);
              } else {
                console.log("Countries saved...");
                resolve({
                  "countries": [],
                  "status": true,
                  "message": "Countries has been saved successfully.",
                });
              }
            });
          } else {
            this.resolveError(resolve);
          }

        }, error => {
          console.log(JSON.stringify(error));
          this.resolveError(resolve);
        });
    });
  }

  resolveError(resolve) {
    resolve({
      "countries": [],
      "status": false,
      "message": "Some error occured while fetching countries.",
    });
  }

}
