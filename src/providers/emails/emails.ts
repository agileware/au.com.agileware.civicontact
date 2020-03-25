import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CiviEmail } from '../../models/CiviEmail';
import { UtilsProvider } from '../utils/utils';
import { DatabaseProvider } from '../database/database';

/*
  Generated class for the EmailsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class EmailsProvider {

  private emails: Array<CiviEmail>;

  constructor(public http: HttpClient, private utilsProvider: UtilsProvider, private databaseProvider: DatabaseProvider) {
    this.emails = new Array<CiviEmail>();
  }

  /**
   * Get information from CiviCRM
   * @param syncinfo
   */
  fetch(syncinfo) {

    console.log("Fetching CiviEmails...");
    return new Promise(resolve => {
      let postParams = {
        'key': syncinfo.sitekey,
        'api_key': syncinfo.apikey,
        'entity': 'MailSettings',
        'action': 'get',
        'json': '{"sequential":1,"is_default":"0"}'
      };

      let resturl = this.utilsProvider.getRestUrl(syncinfo.restendpoint, postParams);
      console.log(resturl);
      this.http.get(resturl)
        .subscribe(data => {
          if (data["is_error"] == 0) {
            this.map(data["values"]);
            console.log(JSON.stringify(this.emails));
            this.databaseProvider.saveCiviEmails(this.emails).then((data) => {
              resolve({
                "emails": this.emails
              });
            });
          } else {
            if (data['error_message'] == 'ERROR: No CMS user associated with given api-key') {
              this.utilsProvider.showAlert('Authentication expired', 'Your login is invalid. Please sign in again.');
            }
          }
        }, error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  /**
   * Map Civi API to model
   * @param values
   */
  map(values) {
    this.emails = new Array<CiviEmail>();
    for (let value of values) {
      let civiEmail = new CiviEmail();
      civiEmail.domain = value["domain"];
      civiEmail.id = value["id"];
      civiEmail.name = value["name"];
      civiEmail.username = value["username"];
      this.emails.push(civiEmail);
    }
  }

}
