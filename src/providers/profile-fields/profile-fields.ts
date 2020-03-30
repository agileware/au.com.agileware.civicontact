import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UtilsProvider } from "../utils/utils";
import { DatabaseProvider } from "../database/database";

/*
  Generated class for the ProfileFieldsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ProfileFieldsProvider {

  constructor(public http: HttpClient, private utilsProvider: UtilsProvider, private databaseProvider: DatabaseProvider) {

  }

  fetch(syncinfo) {
    return new Promise(resolve => {

      let formData = new FormData();
      formData.append('key', syncinfo.sitekey);
      formData.append('api_key', syncinfo.apikey);
      formData.append('entity', 'UFGroup');
      formData.append('action', 'ccaprofilefields');
      formData.append('json', '{"sequential":1}');

      let headers = new HttpHeaders();
      headers.append('content-type', 'multipart/form-data');

      let resturl = syncinfo.restendpoint;

      console.log("Fetching profile fields from ...");
      console.log(resturl);

      this.http.post(resturl, formData, { headers: headers })
        .subscribe(data => {
          console.log("Profile fields fetched...");

          if (data["is_error"] == 0) {
            let profilefieldvalues = data["values"];
            this.databaseProvider.updateProfileFields(profilefieldvalues).then((data) => {
              if (!data["status"]) {
                this.resolveError(resolve);
              } else {
                console.log("Profile fields saved...");
                resolve({
                  "profilefields": [],
                  "status": true,
                  "message": "Profile fields has been saved successfully.",
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
      "profilefields": [],
      "status": false,
      "message": "An error occurred while fetching profile fields.",
    });
  }

}
