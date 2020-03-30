import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UtilsProvider } from "../utils/utils";
import { DatabaseProvider } from "../database/database";
import { Group } from '../../models/group';

/*
  Generated class for the GroupsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class GroupsProvider {
  public groups: Group[];

  constructor(public http: HttpClient, public utilsProvider: UtilsProvider, public databaseProvider: DatabaseProvider) {
    this.groups = new Array<Group>();
  }

  fetch(syncinfo) {
    return new Promise(resolve => {

      let modifieddateparam = "";
      if (syncinfo.lastpulldatetime != "") {
        modifieddateparam = ',"createdat":{">=":"' + syncinfo.lastpulldatetime + '"}';
      }

      let postParams = {
        'key': syncinfo.sitekey,
        'api_key': syncinfo.apikey,
        'entity': 'CCAGroupsLog',
        'action': 'getmodifiedgroups',
        'json': '{"sequential":1' + modifieddateparam + '}'
      };

      let resturl = this.utilsProvider.getRestUrl(syncinfo.restendpoint, postParams);

      console.log("Fetching groups from...");
      console.log(resturl);

      this.http.get(resturl)
        .subscribe(data => {
          if (data["is_error"] == 0) {
            this.map(data["values"]);
            this.databaseProvider.saveGroups(this.groups).then((data) => {
              data["groups"] = this.groups;
              resolve(data);
            });
          } else {
            resolve({
              "status": false,
              "message": data["error_message"] + " occured while fetching groups.",
            });
          }
        }, (error) => {
          resolve({
            "status": false,
            "message": "An error occurred while fetching groups.",
          });
        });
    });
  }

  map(values) {
    for (let value of values) {
      let group = new Group();
      group.id = value["id"];
      group.name = value["title"];
      group.localid = 0;
      group.action = value["action"];
      this.groups.push(group);
    }
  }

  reteriveGroups() {
    return new Promise((resolve) => {
      this.databaseProvider.getAllGroups().then((groups) => {
        resolve(groups);
      });
    });
  }

  getContactsCountOfGroup(groupliveid) {
    return new Promise((resolve) => {
      this.databaseProvider.getContactsCountOfGroup(groupliveid).then((contactscount) => {
        resolve(contactscount);
      });
    });
  }

}
