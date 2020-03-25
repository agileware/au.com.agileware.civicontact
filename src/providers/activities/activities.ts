import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Activity } from "../../models/activity";
import { DatabaseProvider } from "../database/database";

/*
  Generated class for the ActivitiesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ActivitiesProvider {

  private activities: Activity[];

  constructor(public http: HttpClient, private databaseProvider: DatabaseProvider) {
    this.activities = new Array<Activity>();
  }

  /**
   * Get information from CiviCRM
   * @param syncinfo
   */
  fetch(syncinfo) {
    return new Promise(resolve => {

      let modifiedparam = "";
      // Only get updated activities
      if (syncinfo.lastpulldatetime != "") {
        modifiedparam = ',"createdat":{">=":"' + syncinfo.lastpulldatetime + '"}';
      }

      let formData = new FormData();
      formData.append('key', syncinfo.sitekey);
      formData.append('api_key', syncinfo.apikey);
      formData.append('entity', 'Activity');
      formData.append('action', 'ccaactivities');
      formData.append('json', '{"sequential":1' + modifiedparam + '}');

      let headers = new HttpHeaders();
      headers.append('content-type', 'multipart/form-data');

      console.log("Fetching activities...");

      this.http.post(syncinfo.restendpoint, formData, { headers: headers })
        .subscribe(data => {

          console.log("Activities downloaded from remote...");

          if (data["is_error"] == 0) {
            console.log(data);
            this.map(data["values"]);

            this.databaseProvider.saveActivities(this.activities, syncinfo["contactid"]).then((data) => {
              data["activities"] = this.activities;
              resolve(data);
            });

          } else {
            resolve({
              "activities": [],
              "status": false,
              "message": data["error_message"] + " occured while fetching activities.",
            });
          }
        }, error => {
          console.log(JSON.stringify(error));
          resolve({
            "activities": [],
            "status": false,
            "message": "Some error occured while fetching activities.",
          });
        });
    });
  }

  map(values) {
    for (let value of values) {

      let activity = new Activity();
      activity.id = value["id"];
      activity.activitytypeid = value["activity_type_id"];
      activity.activitydatetime = value["activity_date_time"];
      activity.subject = value["subject"];
      activity.createddate = value["created_date"];
      activity.modifieddate = value["modified_date"];
      activity.sourcecontactid = value["source_contact_id"];

      if (typeof value["details"] !== "undefined") {
        activity.details = value["details"];
      }

      let targetContactIds = value["target_contact_id"];
      if (targetContactIds instanceof Array) {
        targetContactIds = JSON.stringify(targetContactIds);
      }

      let assigneeContactIds = value["assignee_contact_id"];
      if (assigneeContactIds instanceof Array) {
        assigneeContactIds = JSON.stringify(assigneeContactIds);
      }

      activity.targetcontactids = targetContactIds;
      activity.assigneecontactids = assigneeContactIds;

      this.activities.push(activity);
    }
  }

}
