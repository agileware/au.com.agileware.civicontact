import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UtilsProvider } from '../utils/utils';
import { DatabaseProvider } from '../database/database';
import 'rxjs/add/operator/map';

/*
  Generated class for the SettingsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SettingsProvider {

  constructor(public http: HttpClient, private utilsProvider: UtilsProvider, private databaseProvider: DatabaseProvider) {

  }

  fetch(syncinfo) {
    return new Promise(resolve => {

      let postParams = {
        'key': syncinfo.sitekey,
        'api_key': syncinfo.apikey,
        'entity': 'setting',
        'action': 'get',
        'json': '{"sequential":1}'
      };

      let resturl = this.utilsProvider.getRestUrl(syncinfo.restendpoint, postParams);

      console.log("Fetching settings from...");
      console.log(resturl);

      this.http.get(resturl)
        .subscribe(data => {
          console.log(data);
          if (data["is_error"] == 0) {
            var settings = data["values"][Object.keys(data['values'])[0]];

            let settingsToSave = {};
            settingsToSave["useglobalconfig"] = "0";

            if ("cca_global_config" in settings) {
              settingsToSave["useglobalconfig"] = settings["cca_global_config"];
            }

            if ("cca_email_to_activity" in settings) {
              settingsToSave["cca_email_to_activity"] = settings["cca_email_to_activity"];
            }

            if ("cca_sync_interval" in settings) {
              settingsToSave["cca_sync_interval"] = settings["cca_sync_interval"];
            }

            if ("cca_force_ssl" in settings) {
              settingsToSave["cca_force_ssl"] = settings["cca_force_ssl"];
            }

            if ("cca_contact_tile_click_action" in settings) {
              settingsToSave["cca_contact_tile_click_action"] = settings["cca_contact_tile_click_action"];
            }

            if ("cca_activity_types" in settings) {
              settingsToSave["cca_activity_types"] = JSON.stringify(settings["cca_activity_types"]);
            }

            this.databaseProvider.updateGlobalConfig(settingsToSave).then((data) => {
              resolve({
                "status": true,
                "updatedsettings": settingsToSave,
              });
            });

          } else {
            resolve({
              "status": false,
              "message": data["error_message"] + " occured while fetching settings.",
            });
          }
        });
    });
  }

}
