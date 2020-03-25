import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UtilsProvider } from '../utils/utils';

/*
  Generated class for the ExtensionProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ExtensionProvider {

  constructor(public http: HttpClient, public utilsProvider: UtilsProvider) {

  }

  checkVersion(syncinfo) {
    console.log("Checking extension version...");
    return new Promise(resolve => {
      let postParams = {
        'key': syncinfo.sitekey,
        'api_key': syncinfo.apikey,
        'entity': 'Extension',
        'action': 'get',
        'json': '{"sequential":1,"full_name":"au.com.agileware.civicontactapi"}'
      };

      let resturl = this.utilsProvider.getRestUrl(syncinfo.restendpoint, postParams);
      this.http.get(resturl)
        .subscribe(data => {
          if (data["is_error"] == 0) {
            if (data["values"].length > 0) {
              let extensioninfo = data["values"][0];
              if ("versioncode" in extensioninfo) {
                let versioncode = extensioninfo["versioncode"];
                this.utilsProvider.showWarningIfUsingOldExtension(versioncode);
              }
            }
            resolve({
              "auth_expired": false
            });
          } else {
            if (data['error_message'] == 'ERROR: No CMS user associated with given api-key') {
              resolve({
                "auth_expired": true
              })
            }
            resolve({
              "auth_expired": false,
              "error": true
            });
          }
        }, error => {
          console.log(JSON.stringify(error));
        });
    });
  }

}
