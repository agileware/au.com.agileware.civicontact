import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContactsProvider } from '../../providers/contacts/contacts';
import { LocationTypesProvider } from '../../providers/location-types/location-types';
import { CallHistoryProvider } from '../../providers/call-history/call-history';
import { FavouritesProvider } from '../../providers/favourites/favourites';
import { LoadingProvider } from '../../providers/loading/loading';
import { App, Events } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { Phone } from '../../models/phone';
import { Email } from '../../models/email';
import { EmailsProvider } from '../../providers/emails/emails';
import { ExtensionProvider } from '../../providers/extension/extension';
import { GroupsProvider } from "../groups/groups";
import { SettingsProvider } from '../settings/settings';
import { ActivitiesProvider } from "../activities/activities";
import { ActivityTypesProvider } from "../activity-types/activity-types";
import { ProfileFieldsProvider } from "../profile-fields/profile-fields";
import { CountriesProvider } from "../countries/countries";
import { WelcomePage } from "../../pages/welcome/welcome";
import { UtilsProvider } from "../utils/utils";

/*
  Generated class for the SyncProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SyncProvider {

  private pullsections: number = 6;
  private pushInProgress: boolean = false;
  private syncInProgress: boolean = false;
  private syncinfo;
  private pulltimestamp;

  constructor(public http: HttpClient, public contactsprovider: ContactsProvider, public locationtypesprovider: LocationTypesProvider,
    public callhistoryprovider: CallHistoryProvider, public favouritesprovider: FavouritesProvider,
    public loadingProvidder: LoadingProvider, public events: Events, public databaseProvider: DatabaseProvider,
    public emailsProvider: EmailsProvider, public extensionProvider: ExtensionProvider, public groupsProvider: GroupsProvider, private settingsProvider: SettingsProvider,
    public activitesProvider: ActivitiesProvider, public activityTypesProvider: ActivityTypesProvider,
    public profileFieldsProvider: ProfileFieldsProvider, private app: App,
    private countriesProvider: CountriesProvider, private utilsProvider: UtilsProvider) {
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.events.subscribe("contact:updated:withprofilefields", (data) => {
      if (typeof data["fromdevice"] !== "undefined" && data["fromdevice"]) {
        this.push();
      }
    });

    this.events.subscribe("contact:inserted:withprofilefields", (data) => {
      if (typeof data["fromdevice"] !== "undefined" && data["fromdevice"]) {
        this.push();
      }
    });

    this.events.subscribe("contact:deleted", (data) => {
      this.push();
    });

    this.events.subscribe("callhistory:inserted", (data) => {
      if (typeof data["fromdevice"] !== "undefined" && data["fromdevice"]) {
        this.push();
      }
    });

    this.events.subscribe("callhistory:updated", (data) => {
      if (typeof data["fromdevice"] !== "undefined" && data["fromdevice"]) {
        this.push();
      }
    });

    this.events.subscribe("activity:inserted", (data) => {
      if (typeof data["fromdevice"] !== "undefined" && data["fromdevice"]) {
        this.push();
      }
    });

    this.events.subscribe("contact:favourited", (data) => {
      if (typeof data["fromdevice"] !== "undefined" && data["fromdevice"]) {
        this.push();
      }
    });

    this.events.subscribe("contact:unfavourited", (data) => {
      if (typeof data["fromdevice"] !== "undefined" && data["fromdevice"]) {
        this.push();
      }
    });
  }

  sync(isForceSync: boolean = false) {
    return new Promise(resolve => {

      if (this.syncInProgress) {
        console.log("Sync in progress, Please wait...");
        resolve({
          "status": false,
          "inprogress": true,
          "message": "Sync in progress, Please wait or restart the app..."
        });
        return;
      }

      this.syncInProgress = true;
      this.pull(isForceSync).then((data) => {
        console.log('done sync pull.');
        if (data["status"]) {
          this.events.publish('sync:pull', {
            "status": true,
            "info": this.syncinfo,
          });
          this.push().then(data => {
            this.syncInProgress = false;
            this.events.publish('sync:push', {
              "status": true,
              "info": this.syncinfo,
            });
            resolve({
              'status': true,
              "info": this.syncinfo,
            });
          });
        } else {
          this.syncInProgress = false;
          resolve(data);
          this.events.publish('sync:pull', {
            "status": false
          });
        }
      });
    });
  }

  pull(firstorforcepull: boolean = false) {
    return new Promise(resolve => {

      if (firstorforcepull) {
        this.pullsections = 7;
      }

      this.databaseProvider.getSyncInfo().then((data) => {
        if (data["status"]) {
          console.log("Got sync info...");

          this.locationtypesprovider.fetch(data["info"]).then(locationtypesdata => {
            if (!locationtypesdata["status"]) {
              if (locationtypesdata['raw_message'] == 'ERROR: No CMS user associated with given api-key') {
                // authentication expired, logout
                this.syncInProgress = false;
                this.forceLogout();
              } else {
                console.log("Resolving from locations type FALSE.");
              }
              resolve(locationtypesdata);
            } else {
              console.log("Location types fetched");
              this.contactsprovider.fetch(data["info"]).then(contacts => {
                if (!contacts["status"]) {
                  console.log("Resolving from contacts FALSE.");
                  resolve(contacts);
                } else {
                  console.log("Contacts fetched", contacts);
                  // Instead or reset the contact every time, compare the number of local database
                  // and remote database
                  this.databaseProvider.getAllContacts().then(contacts => {
                    this.contactsprovider.getCount(data['info']).then(contactCount => {
                      if (contacts['length'] > contactCount['count']) {
                        console.log('contacts mismatch: ', contacts, contactCount);
                        this.databaseProvider.deleteRemovedContacts(contactCount['values']);
                      }
                    })
                  })

                  this.emailsProvider.fetch(data["info"]).then(emails => {

                  });

                  this.extensionProvider.checkVersion(data["info"]).then(() => {

                  });

                  this.settingsProvider.fetch(data["info"]).then((data) => {

                  });

                  let sectionsfetched = 0;

                  this.groupsProvider.fetch(data["info"]).then(groups => {
                    if (!groups["status"]) {
                      resolve(groups);
                    } else {
                      console.log("Groups fetched");
                      sectionsfetched++;
                      this.resolveIfCompleted(sectionsfetched, resolve);
                    }
                  });

                  this.profileFieldsProvider.fetch(data["info"]).then((data) => {
                    if (!data["status"]) {
                      resolve(data);
                    } else {
                      sectionsfetched++;
                      this.resolveIfCompleted(sectionsfetched, resolve);
                    }
                  });

                  if (firstorforcepull) {
                    this.countriesProvider.fetch(data["info"]).then((data) => {
                      if (!data["status"]) {
                        resolve(data);
                      } else {
                        sectionsfetched++;
                        this.resolveIfCompleted(sectionsfetched, resolve);
                      }
                    });
                  }

                  // TODO review
                  this.callhistoryprovider.fetch(data["info"]).then((callhistories) => {
                    if (!callhistories["status"]) {
                      resolve(callhistories);
                    } else {
                      console.log("Call histories fetched");
                      sectionsfetched++;
                      this.resolveIfCompleted(sectionsfetched, resolve);
                    }
                  });

                  // TODO review
                  this.activitesProvider.fetch(data["info"]).then((activitiesdata) => {
                    if (!activitiesdata["status"]) {
                      resolve(activitiesdata);
                    } else {
                      console.log("Activities fetched");
                      sectionsfetched++;
                      this.resolveIfCompleted(sectionsfetched, resolve);
                    }
                  });

                  this.activityTypesProvider.fetch(data["info"]).then((activityTypes) => {
                    if (!activityTypes["status"]) {
                      resolve(activityTypes);
                    } else {
                      console.log("ActivityTypes fetched");
                      sectionsfetched++;
                      this.resolveIfCompleted(sectionsfetched, resolve);
                    }
                  });

                  this.favouritesprovider.fetch(data["info"]).then((favouritesdata) => {
                    if (!favouritesdata["status"]) {
                      resolve(favouritesdata);
                    } else {
                      console.log("Favourites fetched");
                      sectionsfetched++;
                      this.resolveIfCompleted(sectionsfetched, resolve, favouritesdata["timestamp"]);
                    }
                  });

                }
              });
            }
          });
        } else {
          resolve({
            "status": false,
            "message": "User not logged in yet.",
          })
        }
      });

    });
  }

  resolveIfCompleted(sectionsfetched: number, resolve, timestamp: string = "") {
    console.log('current sections: ' + sectionsfetched);
    if (timestamp != "") {
      this.pulltimestamp = timestamp;
    }
    if (sectionsfetched == this.pullsections) {
      this.databaseProvider.updateLastPullDateTime(this.pulltimestamp).then((data) => {
        console.log('all section loaded.');
        resolve({
          'status': true
        });
      });
    }
  }

  push() {
    return new Promise(resolve => {

      if (this.pushInProgress) {
        console.log("Push in progress, Please wait...");
        resolve({
          "status": false,
          "inprogress": true,
        });
        return;
      }

      this.databaseProvider.getSyncInfo().then((data) => {
        let syncinfolocal = data["info"];
        this.syncinfo = syncinfolocal;
        this.extensionProvider.checkVersion(data["info"]).then(result => {
          if (result['auth_expired']) {
            // logout
            this.forceLogout();
            resolve({
              "status": false,
            });
          }

          this.pushInProgress = true;
          console.log("Pushing data to the server...");

          this.pushAllContacts().then((data) => {
            console.log("All contacts pushed");

            this.pushAllCallHistory().then((data) => {
              console.log("All history pushed");

              this.pushAllFavourites().then((data) => {

                console.log("All favourites pushed");

                this.pushAllActivities().then((data) => {

                  console.log("All activities pushed");

                  this.pushInProgress = false;

                  resolve({
                    "status": true,
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  /**
   * Force user to logout due to authentication expired.
   * This does the same thing as the setting page logout
   */
  forceLogout() {
    console.log("force to logout");
    this.databaseProvider.deleteSyncData().then((data) => {
      this.databaseProvider.deleteActiveAccount().then((data) => {
        if (data["status"]) {
          this.utilsProvider.showAlert("Authentication", "Your authentication is expired. Please login again.");
          this.databaseProvider.activateLastAccount().then((data) => {
            this.utilsProvider.trackEvent("App", "Logout", "Logout from Application", 0, true);
            this.app.getRootNav().setRoot(WelcomePage, {
              'fromlogout': true
            });
          });
        } else {
          this.utilsProvider.showAlert("Log Out", "Error occurred while deleting the account, please try again.")
        }
      });
    });
  }

  pushAllFavourites() {
    return new Promise((resolve) => {
      this.pushFavouritesToAdd().then((data) => {
        this.pushFavouritesToRemove().then((data) => {

          resolve({
            "status": true,
          });
        });
      });
    });
  }

  pushFavouritesToRemove() {
    return new Promise((resolve) => {
      this.databaseProvider.getFavouritesToRemove().then(favourites => {
        let favouritestopush = <Array<any>>favourites;

        if (favouritestopush.length == 0) {
          resolve({
            "status": true
          });
        }

        let totalfavouritestopush = favouritestopush.length;
        let favouritespushed = 0;

        for (let favourite of favouritestopush) {

          let favouriteToPush = {
            "sequential": 1,
            "contact_id_a": this.syncinfo.contactid,
            "contact_id_b": favourite.contactid
          };

          let formData = new FormData();
          formData.append('key', this.syncinfo.sitekey);
          formData.append('api_key', this.syncinfo.apikey);
          formData.append('entity', 'relationship');
          formData.append('action', 'removefavourite');
          formData.append('json', JSON.stringify(favouriteToPush));
          let headers = new HttpHeaders();
          headers.append('content-type', 'multipart/form-data');

          this.http.post(this.syncinfo.restendpoint, formData, { headers: headers })
            .subscribe(data => {
              favouritespushed++;

              favourite.updatingfrompush = true;
              favourite.isdeleted = 1;
              this.databaseProvider.updateFavourite(favourite);

              if (favouritespushed == totalfavouritestopush) {
                resolve({
                  "status": true
                });
              }

            });
        }

      });
    });
  }

  pushFavouritesToAdd() {
    return new Promise((resolve) => {
      this.databaseProvider.getFavouritesToPush().then(favourites => {
        let favouritestopush = <Array<any>>favourites;

        if (favouritestopush.length == 0) {
          resolve({
            "status": true
          });
        }

        let totalfavouritestopush = favouritestopush.length;
        let favouritespushed = 0;

        for (let favourite of favouritestopush) {

          let favouriteToPush = {
            "sequential": 1,
            "contact_id_a": this.syncinfo.contactid,
            "contact_id_b": favourite.contactid
          };

          let formData = new FormData();
          formData.append('key', this.syncinfo.sitekey);
          formData.append('api_key', this.syncinfo.apikey);
          formData.append('entity', 'relationship');
          formData.append('action', 'markfavourite');
          formData.append('json', JSON.stringify(favouriteToPush));
          let headers = new HttpHeaders();
          headers.append('content-type', 'multipart/form-data');

          this.http.post(this.syncinfo.restendpoint, formData, { headers: headers })
            .subscribe(data => {
              favouritespushed++;
              if (data["is_error"] == 0) {
                favourite.id = data["id"];
              }

              favourite.updatingfrompush = true;
              this.databaseProvider.updateFavourite(favourite);

              if (favouritespushed == totalfavouritestopush) {
                resolve({
                  "status": true
                });
              }

            });
        }
      });
    });
  }

  pushAllActivities() {
    return new Promise((resolve) => {
      this.databaseProvider.getActivitiesToPush().then((activities) => {
        let activitiestopush = <Array<any>>activities;

        let totalactivitiestoupload = activitiestopush.length;
        let activitiesuploaded = 0;

        if (totalactivitiestoupload == 0) {
          resolve({
            "status": true,
          });
        }

        for (let activitytopush of activitiestopush) {
          let activityToPushData = {
            "source_contact_id": activitytopush.sourcecontactid,
            "activity_type_id": activitytopush.activitytypeid,
            "target_id": activitytopush.targetcontactids,
            "assignee_id": activitytopush.assigneecontactids,
            "subject": activitytopush.subject,
            "details": activitytopush.details,
            "activity_date_time": activitytopush.activitydatetime,
            "status_id": "Completed",
          };

          let formData = new FormData();
          formData.append('key', this.syncinfo.sitekey);
          formData.append('api_key', this.syncinfo.apikey);
          formData.append('entity', 'Activity');
          formData.append('action', 'create');
          formData.append('json', JSON.stringify(activityToPushData));
          let headers = new HttpHeaders();
          headers.append('content-type', 'multipart/form-data');

          this.http.post(this.syncinfo.restendpoint, formData, { headers: headers })
            .subscribe(data => {

              activitytopush.assigneecontactids = JSON.stringify([activitytopush.assigneecontactids]);
              activitytopush.targetcontactids = JSON.stringify([activitytopush.targetcontactids]);

              if (data["is_error"] == 0) {
                activitytopush.id = data["id"];
                activitytopush.updatingfrompush = true;

                this.databaseProvider.updateActivity(activitytopush).then((data) => {
                  activitiesuploaded++;
                  if (activitiesuploaded == totalactivitiestoupload) {
                    resolve({
                      "status": true
                    });
                  }
                });
              } else {
                console.log(JSON.stringify(data));
              }
            });
        }

      });
    });
  }

  pushAllCallHistory() {
    return new Promise((resolve) => {
      this.databaseProvider.getCallHistoryToPush().then((histories) => {
        let callhistories = <Array<any>>histories;

        let totalhistoriestoupload = callhistories.length;
        let historiesuploaded = 0;

        if (totalhistoriestoupload == 0) {
          resolve({
            "status": true,
          });
        }

        for (let callhistory of callhistories) {

          let callHistoryToPush = {
            "source_contact_id": this.syncinfo.contactid,
            "activity_type_id": "Phone Call",
            "target_id": callhistory.contactid,
            "assignee_id": this.syncinfo.contactid,
            "activity_date_time": callhistory.activitydatetime
          };

          if (callhistory.duration != 0) {
            callHistoryToPush["duration"] = callhistory.duration;
          }

          if (callhistory.details != 0) {
            callHistoryToPush["details"] = callhistory.details;
          }

          if (callhistory.id != 0) {
            callHistoryToPush["id"] = callhistory.id;
          }

          let formData = new FormData();
          formData.append('key', this.syncinfo.sitekey);
          formData.append('api_key', this.syncinfo.apikey);
          formData.append('entity', 'Activity');
          formData.append('action', 'create');
          formData.append('json', JSON.stringify(callHistoryToPush));
          let headers = new HttpHeaders();
          headers.append('content-type', 'multipart/form-data');

          this.http.post(this.syncinfo.restendpoint, formData, { headers: headers })
            .subscribe(data => {
              if (data["is_error"] == 0) {
                callhistory.id = data["id"];
                callhistory.updatingfrompush = true;
                this.databaseProvider.updateCallHistory(callhistory).then((data) => {
                  historiesuploaded++;
                  if (historiesuploaded == totalhistoriestoupload) {
                    resolve({
                      "status": true
                    });
                  }
                });
              }
            });
        }
      });
    });
  }

  pushAllContacts() {
    return new Promise((resolve) => {

      this.databaseProvider.getSyncInfo().then((data) => {
        let syncinfolocal = data["info"];
        this.syncinfo = syncinfolocal;

        this.databaseProvider.getContactsToPush().then((contacts) => {
          let contactstoupload = <Array<any>>contacts;
          let totalcontactstoupload = contactstoupload.length;
          let contactsuploaded = 0;

          if (totalcontactstoupload == 0) {
            resolve({
              "status": true,
            });
          }

          for (let contact of contactstoupload) {

            if (contact.isdeleted) {
              this.deleteContact(contact).then((data) => {
                contactsuploaded++;
                if (contactsuploaded == totalcontactstoupload) {
                  resolve({
                    "status": true,
                  });
                }
              });
            } else {
              this.pushContact(contact).then((data) => {
                contactsuploaded++;
                if (contactsuploaded == totalcontactstoupload) {
                  resolve({
                    "status": true,
                  });
                }
              });
            }
          }
        });

      });
    });
  }

  deleteContact(contact) {

    return new Promise((resolve) => {
      let contactToDelete = {
        "id": contact.id
      };

      let formData = new FormData();
      formData.append('key', this.syncinfo.sitekey);
      formData.append('api_key', this.syncinfo.apikey);
      formData.append('entity', 'Contact');
      formData.append('action', 'delete');
      formData.append('json', JSON.stringify(contactToDelete));

      let headers = new HttpHeaders();
      headers.append('content-type', 'multipart/form-data');

      this.http.post(this.syncinfo.restendpoint, formData, { headers: headers })
        .subscribe(data => {

          contact.updatingfrompush = true;
          this.databaseProvider.updateContact(contact).then((data) => {
            resolve(data);
          });

          resolve({
            "status": true,
          });
        });
    });
  }

  pushContact(contact) {

    return new Promise((resolve) => {

      console.log("Pushing a single contact....");

      let isNewContact = true;

      let contactToPush = {
        "contact_type": "Individual",
        "first_name": contact.firstname,
        "last_name": contact.lastname,
        "id": 0,
      };

      if (contact.id != 0 && typeof contact.id !== "undefined") {
        contactToPush.id = contact.id;
        isNewContact = false;
      }

      let index = 1;
      for (let phone of contact.phones) {
        let key = "api.Phone.create";
        if (index != 1) {
          key = key + "." + index;
        }
        index++;
        contactToPush[key] = {
          "location_type_id": phone.type.id,
          "phone": phone.phone,
          "id": phone.id,
        };
      }

      index = 1;
      for (let email of contact.emails) {
        let key = "api.Email.create";
        if (index != 1) {
          key = key + "." + index;
        }
        index++;
        contactToPush[key] = {
          "location_type_id": email.type.id,
          "email": email.email,
          "id": email.id,
        };
      }

      contactToPush['ProfileFieldsData'] = contact.profilefieldsdata;

      let formData = new FormData();
      formData.append('key', this.syncinfo.sitekey);
      formData.append('api_key', this.syncinfo.apikey);
      formData.append('entity', 'Contact');
      formData.append('action', 'ccacreate');
      formData.append('json', JSON.stringify(contactToPush));

      let headers = new HttpHeaders();
      headers.append('content-type', 'multipart/form-data');

      this.http.post(this.syncinfo.restendpoint, formData, { headers: headers })
        .subscribe(data => {
          if (data["is_error"] == 0) {
            contact.id = data["id"];

            let phones = contact.phones;
            let emails = contact.emails;

            contact.phones = [];
            contact.emails = [];

            let datacontact = data["values"][contact.id];
            let totalphones = phones.length;
            for (let index = 1; index <= totalphones; index++) {
              let key = "api.Phone.create";
              if (index != 1) {
                key = key + "." + index;
              }

              if (typeof datacontact[key] !== "undefined") {
                let locationtypeid = datacontact[key]["values"][0]["location_type_id"];
                let id = datacontact[key]["id"];
                let phonetxt = datacontact[key]["values"][0]["phone"];
                let locationtype = this.locationtypesprovider.getLocationType(locationtypeid);
                let phoneobject = new Phone(id, locationtype, phonetxt);
                if (locationtype != null) {
                  contact.phones.push(phoneobject);
                }
              }
            }

            let totalemails = emails.length;
            for (let index = 1; index <= totalemails; index++) {
              let key = "api.Email.create";
              if (index != 1) {
                key = key + "." + index;
              }

              if (typeof datacontact[key] !== "undefined") {
                let locationtypeid = datacontact[key]["values"][0]["location_type_id"];
                let id = datacontact[key]["id"];
                let emailtxt = datacontact[key]["values"][0]["email"];
                let emailobject = new Email(id, locationtypeid, emailtxt);
                let locationtype = this.locationtypesprovider.getLocationType(locationtypeid);
                if (locationtype != null) {
                  emailobject.type = locationtype;
                  contact.emails.push(emailobject);
                }
              }
            }

            this.addContactInGroup(contact);

            contact.updatingfrompush = true;
            this.databaseProvider.updateContact(contact).then((data) => {
              if (isNewContact) {
                this.databaseProvider.updateContactReferenceInProfileFieldsData(contact.id, contact.localid).then((data) => {
                  resolve(data);
                })
              } else {
                resolve(data);
              }
            });
          } else {
            console.log(data["error_message"]);
            resolve({
              "status": false,
            });
          }
        }, error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
          });
        });
    });

  }

  addContactInGroup(contact) {

    var groupContactObject = {};
    groupContactObject["group_id"] = this.syncinfo.defaultgroupid;
    groupContactObject["contact_id"] = contact.id;


    let formData = new FormData();
    formData.append('key', this.syncinfo.sitekey);
    formData.append('api_key', this.syncinfo.apikey);
    formData.append('entity', 'GroupContact');
    formData.append('action', 'create');
    formData.append('json', JSON.stringify(groupContactObject));

    let headers = new HttpHeaders();
    headers.append('content-type', 'multipart/form-data');

    this.http.post(this.syncinfo.restendpoint, formData, { headers: headers })
      .subscribe(data => {

      }, error => {
        console.log("GroupContact Create Errors");
        console.log(JSON.stringify(error));
      });
  }
}
