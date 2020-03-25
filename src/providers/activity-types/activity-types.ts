import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DatabaseProvider } from "../database/database";
import { ActivityType } from "../../models/activity-type";
import { UtilsProvider } from "../utils/utils";

/*
  Generated class for the ActivityTypesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ActivityTypesProvider {

  private activitytypes: ActivityType[];

  constructor(public http: HttpClient, private databaseProvider: DatabaseProvider, private utilsProvider: UtilsProvider) {
    this.activitytypes = new Array<ActivityType>();
  }

  fetch(syncinfo) {
    return new Promise(resolve => {
      let allowedActivityTypes = syncinfo['ccaactivitytypes'];
      if (allowedActivityTypes == '') {
        allowedActivityTypes = '[""]';
      }
      let postParams = {
        'key': syncinfo.sitekey,
        'api_key': syncinfo.apikey,
        'entity': 'OptionValue',
        'action': 'get',
        'json': '{"sequential":1,"option_group_id":"activity_type","options":{"limit":0},"value":{"IN":' + allowedActivityTypes + '}}'
      };
      let resturl = this.utilsProvider.getRestUrl(syncinfo.restendpoint, postParams);

      console.log("Fetching activity types from ...");
      console.log(resturl);

      this.http.get(resturl)
        .subscribe(data => {
          if (data["is_error"] == 0) {
            this.map(data["values"]);

            this.databaseProvider.saveActivityTypes(this.activitytypes).then((data) => {
              resolve({
                "activitytypes": this.activitytypes,
                "status": true,
                "message": data["error_message"] + " occured while fetching activitytypes.",
              });
            });

          } else {
            resolve({
              "activitytypes": [],
              "status": false,
              "message": data["error_message"] + " occured while fetching activitytypes.",
            });
          }
        }, error => {
          console.log(JSON.stringify(error));
          resolve({
            "activitytypes": [],
            "status": false,
            "message": "Some error occured while fetching activitytypes.",
          });
        });
    });
  }

  map(values) {
    for (let value of values) {

      let activitytype = new ActivityType();
      activitytype.id = value["id"];
      activitytype.label = value["label"];
      activitytype.value = value["value"];
      activitytype.name = value["isactive"];
      activitytype.isactive = value["isactive"];
      activitytype.icon = value["icon"];

      this.activitytypes.push(activitytype);
    }
  }

}
