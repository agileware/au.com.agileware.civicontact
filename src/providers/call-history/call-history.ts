import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CallHistory } from '../../models/callhistory';
import { ContactsProvider } from '../../providers/contacts/contacts';
import { DatabaseProvider } from '../../providers/database/database';
import { UtilsProvider } from '../utils/utils';
import { Contact } from '../../models/contact';

/*
  Generated class for the CallHistoryProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class CallHistoryProvider {

  public callhistories: Array<CallHistory>;

  constructor(public http: HttpClient, public contactsprovider: ContactsProvider, private databaseProvider: DatabaseProvider,
    public utilsProvider: UtilsProvider) {
    this.callhistories = new Array<CallHistory>();
  }

  fetch(syncinfo) {
    return new Promise(resolve => {

      let modifieddateparam = "";
      if (syncinfo.lastpulldatetime != "") {
        //modifieddateparam = '"modified_date":{">=":"'+syncinfo.lastpulldatetime+'"},';
      }

      let postParams = {
        'key': syncinfo.sitekey,
        'api_key': syncinfo.apikey,
        'entity': 'activity',
        'action': 'get',
        'json': '{"sequential":1,"source_contact_id":' + syncinfo.contactid + ',"return":"target_contact_id,source_contact_id,assignee_contact_id,activity_date_time,duration,created_date,modified_date","activity_type_id":"Phone Call",' + modifieddateparam + '"options":{"sort":"id DESC"}}'
      };

      let resturl = this.utilsProvider.getRestUrl(syncinfo.restendpoint, postParams);

      console.log("Fetching call histories from...");
      console.log(resturl);

      this.http.get(resturl)
        .subscribe(data => {

          if (data["is_error"] == 0) {
            this.map(data["values"]).then((data) => {

              this.databaseProvider.saveCallHistory(this.callhistories);
              console.log('save history and resolve.');
              resolve({
                "status": true,
                "locationhistories": this.callhistories,
              });

            });
          } else {
            resolve({
              "status": false,
              "message": data["error_message"] + " occured while fetching call histories.",
            });
          }
        });
    });
  }

  retrieve() {
    return new Promise(resolve => {
      this.databaseProvider.getCallHistory().then((callhistories) => {
        this.callhistories = <Array<CallHistory>>callhistories;
        resolve({
          'callhistories': this.callhistories,
        });
      });
    });
  }

  map(values) {
    return new Promise((resolve) => {
      if (values.length == 0) {
        resolve();
      }
      let historyperformed = 0;
      for (let value in values) {
        if (!values.hasOwnProperty(value)) {
          continue;
        }
        value = values[value];
        let callhistory = new CallHistory();
        callhistory.activitydatetime = value["activity_date_time"]; //new Date(value["activity_date_time"]);
        callhistory.createddate = value["created_date"]; //new Date(value["created_date"]);
        callhistory.id = value["id"];
        callhistory.modifieddate = value["modified_date"]; //new Date(value["modified_date"]);

        // if (typeof value['target_contact_id'] !== 'undefined') {
        //   let contactid = value["target_contact_id"][Object.keys(value["target_contact_id"])[0]];
        //   callhistory.contactid = contactid;
        // }

        let contactid = 0;
        try {
          contactid = value["target_contact_id"][0];
        } catch (e) {
          console.log(value);
        }
        callhistory.contactid = contactid;

        if (typeof value["duration"] !== "undefined") {
          callhistory.duration = value["duration"];
        }

        if (typeof value["details"] != "undefined") {
          callhistory.details = value["details"];
        }

        this.contactsprovider.addCallHistory(contactid).then((contact) => {
          historyperformed++;
          if (contact != null) {
            callhistory.contact = <Contact>contact;
            this.callhistories.push(callhistory);
          }
          if (historyperformed == values.length) {
            resolve();
          }
        });
      }
    });
  }

  search(searchterm) {
    return new Promise((resolve) => {
      this.databaseProvider.getCallHistory(searchterm).then((callhistories) => {
        resolve(callhistories);
      });
    });
  }

}
