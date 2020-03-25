import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { UtilsProvider } from '../../providers/utils/utils';
import { Events } from 'ionic-angular';
import { Contact } from '../../models/contact';
import { Phone } from '../../models/phone';
import { Email } from '../../models/email';
import { CiviEmail } from '../../models/CiviEmail';
import { CallHistory } from '../../models/callhistory';
import { LocationType } from '../../models/locationtype';
import { Favourite } from '../../models/favourite';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { Group } from "../../models/group";
import { Activity } from "../../models/activity";
import { ActivityType } from "../../models/activity-type";
import { Profilefielddata } from "../../models/profilefielddata";

/*
  Generated class for the DatabaseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class DatabaseProvider {

  private database: SQLiteObject;
  private PAGE_ROW_LIMIT = 15;
  private masterdatabase: SQLiteObject;
  private schemaVersion = 303;

  constructor(public http: HttpClient, public sqlite: SQLite, public utilsProvider: UtilsProvider,
    public events: Events, public googleAnalytics: GoogleAnalytics) {
    this.database = null;
  }

  /**
   * Initialize master database
   */
  openOrCreateMasterDB() {
    return new Promise(resolve => {
      this.sqlite.create({
        name: "master.db",
        location: "default"
      }).then((db: SQLiteObject) => {
        this.masterdatabase = db;
        this.isMasterExist().then(exist => {
          if (!exist) {
            // installation - first time running this app
            this.createMasterTables();
            this.setUserVersion();
          }
          this.maybeUpgradeMasterDB();
          this.events.publish("masterdatabase:ready", {
            "status": true
          });
          resolve({
            "status": true
          });
        });

      }).catch(error => {
        this.utilsProvider.showCatchError("Create Master Database", error);
        this.events.publish("masterdatabase:ready", {
          "status": false,
          "error": error
        });
        resolve({
          "status": false,
          "error": error,
        });
      });
    });
  }

  /**
   * Initialize user database
   * @param contactid
   */
  openOrCreateDB(contactid) {
    return new Promise(resolve => {
      this.sqlite.create({
        name: contactid + ".db",
        location: "default"
      }).then((db: SQLiteObject) => {
        this.database = db;
        this.createTables();
        this.maybeUpgradeDB();
        this.events.publish("database:ready", {
          "status": true
        });
        resolve({
          "status": true
        });
      }).catch(error => {
        this.utilsProvider.showCatchError("Create Database", error);
        this.events.publish("database:ready", {
          "status": false,
          "error": error
        });
        resolve({
          "status": false,
          "error": error,
        });
      });
    });
  }

  public hasLogin() {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("SELECT * FROM accounts WHERE isactive = ?", [
        1,
      ])
        .then(result => {
          if (result.rows.length > 0) {
            resolve({
              "login": true,
            });
          } else {
            resolve({
              "login": false,
            });
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "login": false
          });
        });
    });
  }

  /**
   * Check if this app is previously installed or not
   */
  private isMasterExist() {
    return new Promise(resolve => {
      this.getUserVersion().then(result => {
        if (result === 0) {
          // database not exist
          resolve(false);
        } else {
          resolve(true);
        }
      })
    });
  }

  /**
   * Tables for master database
   */
  private createMasterTables() {
    this.createAccountsTable();
  }

  /**
   * Tables for user database
   */
  private createTables() {
    this.createContactsTable();
    this.createHistoryTable();
    this.createFavouritesTable();
    this.createLocationTypesTable();
    this.createSyncTable();
    this.createEmailsTable();
    this.createGroupsTable();
    this.createActivitiesTable();
    this.createActivityTypesTable();
    this.createProfileFieldsDataTable();
  }

  /**
   * The upgrade after tables created.
   */
  private maybeUpgradeMasterDB() {

  }

  /**
   * The upgrdae after tables created.
   */
  private maybeUpgradeDB() {

  }

  /**
   * Set the schema version
   */
  private setUserVersion(version = null) {
    if (version === null) {
      version = this.schemaVersion;
    }
    this.masterdatabase.executeSql(`pragma user_version = ${version};`, [])
      .then(result => {
        console.log(result);
      })
      .catch(error => {
        console.error('failed to set the user version', error);
      });
  }

  private getUserVersion() {
    return new Promise(resolve => {
      this.masterdatabase.executeSql('pragma user_version;', []).then(result => {
        resolve(result.rows.item(0).user_version);
      }).catch(error => {
        // any error
        console.log(error);
      });
    })
  }

  /**
   * In master database
   */
  private createAccountsTable() {
    this.masterdatabase.executeSql('CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY, contact_id INTEGER, contact_name INTEGER, api_key TEXT, site_key TEXT, rest_end_point TEXT, isactive INTEGER, defaultgroupid INTEGER DEFAULT 0, useglobalconfig INTEGER DEFAULT 0)', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createGroupsTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS contactgroups(id INTEGER PRIMARY KEY, liveid INTEGER UNIQUE, name TEXT, isdeleted INTEGER DEFAULT 0)', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createEmailsTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS emails(id INTEGER PRIMARY KEY, name TEXT, username TEXT, domain TEXT, liveid INTEGER UNIQUE)', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createContactsTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY, imageurl TEXT, firstname TEXT, lastname TEXT, sortname TEXT, createddate TEXT, modifieddate TEXT, isfavourite INTEGER, colorclass TEXT, isuploaded INTEGER DEFAULT 1, isdeleted INTEGER DEFAULT 0, phones TEXT, emails TEXT, liveid INTEGER UNIQUE, groups TEXT)', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createSyncTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS sync(id INTEGER PRIMARY KEY, contactid INTEGER, contactname TEXT, apikey TEXT, sitekey TEXT, restendpoint TEXT, lastpulldatetime TEXT, lastpushdatetime TEXT, syncinterval TEXT DEFAULT "3600", emailtoactivity INTEGER DEFAULT 0, defaultgroupid INTEGER DEFAULT 0, useglobalconfig INTEGER DEFAULT 0, domainname TEXT DEFAULT "", ccaforcessl INTEGER DEFAULT 0, ccacontacttileclickaction TEXT DEFAULT "", ccaactivitytypes TEXT DEFAULT "", ccaprofilefields TEXT DEFAULT "", ccacountries TEXT DEFAULT "", google_analytics_id TEXT DEFAULT "")', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createHistoryTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS histories(id INTEGER PRIMARY KEY, activitydatetime TEXT, createddate TEXT, modifieddate TEXT, contactid INTEGER, contactidlocal INTEGER, isuploaded INTEGER DEFAULT 1, duration INTEGER DEFAULT 0, details TEXT, liveid INTEGER, FOREIGN KEY(contactidlocal) REFERENCES contacts(id))', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createFavouritesTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS favourites(id INTEGER PRIMARY KEY, contactid INTEGER, contactidlocal INTEGER, isuploaded INTEGER DEFAULT 1, liveid INTEGER UNIQUE, isdeleted INTEGER DEFAULT 0, FOREIGN KEY(contactidlocal) REFERENCES contacts(id))', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createLocationTypesTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS locationtypes(id INTEGER PRIMARY KEY, name TEXT, displayname TEXT, vcardname TEXT, description TEXT, isdefault INTEGER DEFAULT 0, liveid INTEGER UNIQUE)', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createActivitiesTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS activities(id INTEGER PRIMARY KEY, activitytypeid TEXT, subject TEXT, activitydatetime TEXT, sourcecontactid TEXT, targetcontactids TEXT, assigneecontactids TEXT, sourcecontactidlocal TEXT, targetcontactidslocal TEXT, assigneecontactidslocal TEXT, details TEXT, createddate TEXT, modifieddate TEXT, liveid INTEGER UNIQUE, isuploaded INTEGER DEFAULT 1)', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createActivityTypesTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS activitytypes(id INTEGER PRIMARY KEY, label TEXT, value TEXT, name TEXT, isactive TEXT, icon TEXT, liveid INTEGER UNIQUE DEFAULT 0)', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * In user database
   */
  private createProfileFieldsDataTable() {
    this.database.executeSql('CREATE TABLE IF NOT EXISTS profilefieldsdata(id INTEGER PRIMARY KEY, contactid INTEGER DEFAULT 0, contactidlocal INTEGER DEFAULT 0, fieldname TEXT DEFAULT "", value TEXT DEFAULT "", label TEXT DEFAULT "", FOREIGN KEY(contactidlocal) REFERENCES contacts(id))', [])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * Will insert or update the record by ID
   * @param locationtypes A list of location type
   */
  saveLocationTypes(locationtypes: LocationType[]) {
    for (let locationtype of locationtypes) {
      if (typeof locationtype !== "undefined" && locationtype != null) {
        this.findLocationType(locationtype.id).then((retrivedlocationtype) => {
          if (retrivedlocationtype != null) {
            this.updateLocationType(locationtype);
          } else {
            this.insertLocationType(locationtype);
          }
        });
      }
    }
  }

  /**
   * Insert or update the record by ID
   * @param emails
   */
  saveCiviEmails(emails: CiviEmail[]) {
    return new Promise((resolve) => {
      let totalemails = emails.length;
      let emailprocessed = 0;

      if (totalemails == 0) {
        resolve({
          "status": true
        });
      }
      for (let email of emails) {
        this.findCiviEmail(email.id).then((retrivedemail) => {
          if (retrivedemail != null) {
            email.localid = retrivedemail["id"];
            this.updateCiviEmail(email).then((data) => {
              emailprocessed++;
              this.resolveSaveCiviEmails(totalemails, emailprocessed, resolve);
            });
          } else {
            this.insertCiviEmail(email).then((data) => {
              emailprocessed++;
              this.resolveSaveCiviEmails(totalemails, emailprocessed, resolve);
            });
          }
        });
      }
    });
  }

  /**
   * Resolve the promise if all emails saved
   * @param totalemails
   * @param emailprocessed
   * @param resolve
   */
  resolveSaveCiviEmails(totalemails, emailprocessed, resolve) {
    if (totalemails == emailprocessed) {
      resolve({
        "status": true
      });
    }
  }

  /**
   * Get current time in format
   */
  getCurrentDateTime() {
    let today = new Date();
    return this.getDateInFormat(today);
  }

  /**
   * Format the given time
   * @param date
   * @param onlyDate
   */
  getDateInFormat(date, onlyDate: boolean = false) {
    let datestring = date.getFullYear() + '-' + this.aZero(date.getMonth() + 1) + '-' + this.aZero(date.getDate());
    let time = this.aZero(date.getHours()) + ":" + this.aZero(date.getMinutes()) + ":" + this.aZero(date.getSeconds());
    let dateTime = datestring;
    if (!onlyDate) {
      dateTime = datestring + ' ' + time;
    }
    return dateTime;
  }

  /**
   * Better readable format for given time
   * @param date
   */
  getDateInViewableFormat(date) {
    let datestring = this.aZero(date.getDate()) + '/' + this.aZero(date.getMonth() + 1) + '/' + date.getFullYear();
    return datestring;
  }

  /**
   * Append zero in front of it
   * @param value
   */
  aZero(value) {
    if (value < 10) {
      return '0' + value;
    }
    return value;
  }

  recordCallHistory(contact, phonenumber) {
    return new Promise((resolve) => {
      let history = new CallHistory();

      history.activitydatetime = this.getCurrentDateTime();
      history.contact = contact;
      history.contactid = contact.id;
      history.contactidlocal = contact.localid;
      history.id = 0;

      this.insertCallHistory(history, true).then((data) => {
        resolve(data);
      });
    });
  }

  deleteRemovedContacts(ids) {
    // Set all contact to deleted. The contact remaining in the group will be set back
    this.database.executeSql('DELETE FROM contacts WHERE liveid NOT IN (?)', [ids.join(',')]);
  }

  saveContacts(contacts) {
    return new Promise((resolve) => {
      let contactstoprocess = 0;
      let contactsprocessed = 0;

      for (let contact of contacts) {
        if ((typeof contact !== "undefined" && contact != null) && (contact.firstname.trim() != '' || contact.lastname.trim() != '')) {
          contactstoprocess++;
        }
      }

      if (contacts.length == 0) {
        resolve({
          "status": true
        });
      }

      for (let contact of contacts) {
        if ((typeof contact !== "undefined" && contact != null) && (contact.firstname.trim() != '' || contact.lastname.trim() != '')) {
          this.findContact(contact.id).then((retrivedcontact) => {
            if (retrivedcontact == null && contact.action == "create") {
              this.insertContact(contact).then((data) => {
                this.saveProfileFieldsData(contact).then((profiledata) => {
                  contactsprocessed++;
                  this.resolveSavedContacts(resolve, contactsprocessed, contactstoprocess);
                });
              });
            } else {
              if (contact.action == "delete") {
                contact.isdeleted = 1;
              } else if (contact.action == "create") {
                contact.isdeleted = 0;
              } else {
                contact.isdeleted = retrivedcontact["isdeleted"];
              }

              if (retrivedcontact != null) {
                contact.isfavourite = retrivedcontact["isfavourite"];
                contact.localid = retrivedcontact["localid"];
                contact.colorclass = retrivedcontact["colorclass"];
                this.updateContact(contact).then((data) => {
                  this.saveProfileFieldsData(contact).then((profiledata) => {
                    contactsprocessed++;
                    this.resolveSavedContacts(resolve, contactsprocessed, contactstoprocess);
                  });
                });
              } else {
                contactsprocessed++;
                this.resolveSavedContacts(resolve, contactsprocessed, contactstoprocess);
              }
            }
          });
        }
      }
    });
  }

  resolveSavedContacts(resolve, contactsprocessed, contactstoprocess) {
    if (contactsprocessed == contactstoprocess) {
      resolve({
        "status": true
      });
    }
  }

  saveFavourites(favourites) {

    return new Promise((resolve) => {
      let validFavouritesToPerform = 0;

      for (let favourite of favourites) {
        if (typeof favourite !== "undefined" && favourite != null) {
          validFavouritesToPerform++;
        }
      }

      if (validFavouritesToPerform == 0) {
        resolve({
          "status": true
        });
      }

      let favouriteperformed = 0;
      for (let favourite of favourites) {
        if (typeof favourite !== "undefined" && favourite != null) {
          if (favourite.contactidlocal == 0) {
            this.findContact(favourite.contactid).then((contact) => {
              if (contact != null) {
                favourite.contactidlocal = contact["localid"];
                this.performFavouriteOperation(favourite, validFavouritesToPerform).then((data) => {
                  favouriteperformed++;
                  this.publishIfAllFavouritesDone(validFavouritesToPerform, favouriteperformed, resolve);
                });
              }
            });
          } else {
            this.performFavouriteOperation(favourite, validFavouritesToPerform).then((data) => {
              favouriteperformed++;
              this.publishIfAllFavouritesDone(validFavouritesToPerform, favouriteperformed, resolve);
            });
          }
        }
      }
    });
  }

  saveActivityTypes(activityTypes) {
    return new Promise((resolve) => {
      let totalActivityTypesToSave = activityTypes.length;
      let totalActivityTypesPerformed = 0;
      if (totalActivityTypesToSave == 0) {
        resolve({
          "status": true,
        });
      }
      for (let activitytype of activityTypes) {
        this.findActivityType(activitytype.id).then((foundedActivityType) => {
          if (foundedActivityType == null) {
            this.insertActivityType(activitytype).then((data) => {
              totalActivityTypesPerformed++;
              this.resolveActivityTypesOnComplete(totalActivityTypesPerformed, totalActivityTypesToSave, resolve);
            });
          } else {
            activitytype.localid = foundedActivityType["id"];
            this.updateActivityType(activitytype).then((data) => {
              totalActivityTypesPerformed++;
              this.resolveActivityTypesOnComplete(totalActivityTypesPerformed, totalActivityTypesToSave, resolve);
            });
          }
        });
      }
    });
  }

  saveActivities(activities, loggedInContactId) {
    return new Promise((resolve) => {
      let totalActivitiesToSave = activities.length;
      console.log("Total activities to save " + totalActivitiesToSave + " ...");
      let totalActivitiesPerformed = 0;
      if (totalActivitiesToSave == 0) {
        resolve({
          "status": true,
        });
      }
      for (let activity of activities) {
        this.findActivity(activity.id).then((foundedActivity) => {
          if (foundedActivity == null) {
            this.insertActivity(activity).then((data) => {
              totalActivitiesPerformed++;
              this.resolveActivitiesOnComplete(totalActivitiesPerformed, totalActivitiesToSave, resolve, loggedInContactId);
            });
          } else {
            activity.localid = foundedActivity["id"];
            this.updateActivity(activity, false, true).then((data) => {
              totalActivitiesPerformed++;
              this.resolveActivitiesOnComplete(totalActivitiesPerformed, totalActivitiesToSave, resolve, loggedInContactId);
            });
          }
        });
      }
    });
  }

  saveGroups(groups) {
    return new Promise((resolve) => {
      let totalGroupsToSave = groups.length;
      let totalGroupsPerformed = 0;

      if (totalGroupsToSave == 0) {
        resolve({
          "status": true,
        });
      }

      for (let group of groups) {

        if (group.action == "on") {
          this.findGroup(group.id).then((foundedgroup) => {
            if (foundedgroup == null) {
              this.insertGroup(group).then((data) => {
                totalGroupsPerformed++;
                this.resolveGroupsOnComplete(totalGroupsPerformed, totalGroupsToSave, resolve);
              });
            } else {
              group.localid = foundedgroup["id"];
              group.isdeleted = 0;
              this.updateGroup(group).then((data) => {
                totalGroupsPerformed++;
                this.resolveGroupsOnComplete(totalGroupsPerformed, totalGroupsToSave, resolve);
              });
            }
          });
        } else {
          this.deleteGroup(group.id).then((data) => {
            totalGroupsPerformed++;
            this.resolveGroupsOnComplete(totalGroupsPerformed, totalGroupsToSave, resolve);
          });
        }
      }

    });
  }

  resolveGroupsOnComplete(totalGroupsSaved, totalGroupsToSave, resolve) {
    if (totalGroupsSaved == totalGroupsToSave) {
      this.events.publish("groups:saved", {});

      resolve({
        "status": true,
      });
    }
  }

  getActivitiesToUpdate(result) {
    let activitiesToUpdate = {};
    let uniqueContactsToFind = [];

    let totalNeedsUpdate = result.rows.length;
    for (let i = 0; i < totalNeedsUpdate; i++) {
      let activityItem = result.rows.item(i);

      let sourceid = "";
      let targetIds = [];
      let assigneeIds = [];

      activitiesToUpdate[activityItem.id] = [];

      if ((activityItem.sourcecontactidlocal == '' || activityItem.sourcecontactidlocal == '-') && activityItem.sourcecontactid != "") {
        sourceid = activityItem.sourcecontactid;
        uniqueContactsToFind.push(sourceid);
      }

      if ((activityItem.targetcontactidslocal == '' || activityItem.targetcontactidslocal == '[]' || activityItem.targetcontactidslocal.indexOf("0") >= 0) && activityItem.targetcontactids != "") {
        if (activityItem['targetcontactids'].indexOf("[") >= 0) {
          targetIds = JSON.parse(activityItem['targetcontactids']);
        } else {
          targetIds.push(activityItem['targetcontactids']); // for single targets
        }
        uniqueContactsToFind = uniqueContactsToFind.concat(targetIds);
      }

      if ((activityItem.assigneecontactidslocal == '' || activityItem.assigneecontactidslocal == '[]' || activityItem.assigneecontactidslocal.indexOf("0") >= 0) && activityItem.assigneecontactids != "") {
        if (activityItem['targetcontactids'].indexOf("[") >= 0) {
          assigneeIds = JSON.parse(activityItem['assigneecontactids']);
        } else {
          assigneeIds.push(activityItem['assigneecontactids']); // for single assignees
        }

        uniqueContactsToFind = uniqueContactsToFind.concat(assigneeIds);
      }

      activitiesToUpdate[activityItem.id].push(sourceid);
      activitiesToUpdate[activityItem.id].push(targetIds);
      activitiesToUpdate[activityItem.id].push(assigneeIds);
    }

    return {
      'activitiesToUpdate': activitiesToUpdate,
      'uniqueContactsToFind': uniqueContactsToFind,
    };
  }

  ammendLocalIdsInAcvitities(activitiesToUpdate, contactIdsMap) {
    for (let activityToUpdate in activitiesToUpdate) {

      let sourceid = activitiesToUpdate[activityToUpdate][0];
      let targetIds = [];
      let assigneeIds = [];

      if (activitiesToUpdate[activityToUpdate].length > 0) {
        targetIds = activitiesToUpdate[activityToUpdate][1];
      }

      if (activitiesToUpdate[activityToUpdate].length > 1) {
        assigneeIds = activitiesToUpdate[activityToUpdate][2];
      }

      let sourceidLocal = "0";
      let targetIdsLocal = [];
      let assigneeIdsLocal = [];

      if (sourceid in contactIdsMap) {
        sourceidLocal = contactIdsMap[sourceid];
      }

      for (let targetid of targetIds) {
        if (targetid in contactIdsMap) {
          targetIdsLocal.push(contactIdsMap[targetid]);
        } else {
          targetIdsLocal.push("0");
        }
      }

      for (let assigneeid of assigneeIds) {
        if (assigneeid in contactIdsMap) {
          assigneeIdsLocal.push(contactIdsMap[assigneeid]);
        } else {
          assigneeIdsLocal.push("0");
        }
      }

      activitiesToUpdate[activityToUpdate].push(sourceidLocal);
      activitiesToUpdate[activityToUpdate].push(targetIdsLocal);
      activitiesToUpdate[activityToUpdate].push(assigneeIdsLocal);
    }

    return activitiesToUpdate;
  }

  getContactIdsMapFromResult(contacts, loggedInContactId) {
    let contactIdsMap = {};
    let totalContacts = contacts['length'];

    for (let j = 0; j < totalContacts; j++) {
      contactIdsMap[contacts[j]['id']] = contacts[j]['localid'];
    }

    contactIdsMap[loggedInContactId] = "-1";
    return contactIdsMap;
  }

  updateLocalIdsInAllActivities(loggedInContactId) {
    return new Promise((resolve) => {
      this.database.executeSql("SELECT * FROM activities WHERE sourcecontactidlocal = '' OR sourcecontactidlocal = '-' OR targetcontactidslocal = '' OR targetcontactidslocal = '[]' OR targetcontactidslocal = '%-%' OR assigneecontactidslocal = '' OR assigneecontactidslocal = '[]' OR assigneecontactidslocal = '%-%'", [])
        .then(result => {
          let dataResult = this.getActivitiesToUpdate(result);
          let uniqueContactsToFind = dataResult['uniqueContactsToFind'];
          let activitiesToUpdate = dataResult['activitiesToUpdate'];

          uniqueContactsToFind = Array.from(new Set(uniqueContactsToFind));

          if (result.rows.length == 0) {
            resolve(true);
          }

          this.findContacts(uniqueContactsToFind.join()).then((contacts) => {
            let contactIdsMap = this.getContactIdsMapFromResult(contacts, loggedInContactId);
            activitiesToUpdate = this.ammendLocalIdsInAcvitities(activitiesToUpdate, contactIdsMap);
            this.updateActivityArrays(activitiesToUpdate).then((data) => {
              resolve(true);
            });
          });

        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  updateActivityLocalValues(activityToUpdate, activityid) {
    return new Promise((resolve) => {
      this.database.executeSql('UPDATE activities SET sourcecontactidlocal=?, targetcontactidslocal=?, assigneecontactidslocal = ? WHERE id = ?', [
        activityToUpdate[3],
        JSON.stringify(activityToUpdate[4]),
        JSON.stringify(activityToUpdate[5]),
        activityid,
      ])
        .then(result => {
          resolve(true);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve(false);
        });
    });
  }

  updateActivityArrays(activitiesToUpdate) {
    return new Promise((resolve) => {
      let totalActivitiesToUpdate = Object.keys(activitiesToUpdate).length;
      let totalActivitiesUpdated = 0;
      for (let activityid in activitiesToUpdate) {
        this.updateActivityLocalValues(activitiesToUpdate[activityid], activityid).then((data) => {
          totalActivitiesUpdated++;
          if (totalActivitiesUpdated == totalActivitiesToUpdate) {
            resolve(true);
          }
        });
      }
    });
  }

  resolveActivityTypesOnComplete(totalActivityTypesPerformed, totalActivityTypesToSave, resolve) {
    if (totalActivityTypesPerformed == totalActivityTypesToSave) {
      this.events.publish("activitytypes:saved", {});

      resolve({
        "status": true,
      });
    }
  }

  resolveActivitiesOnComplete(totalActivitiesPerformed, totalActivitiesToSave, resolve, loggedInContactId) {
    if (totalActivitiesPerformed == totalActivitiesToSave) {
      this.updateLocalIdsInAllActivities(loggedInContactId).then((data) => {
        this.events.publish("activities:saved", {});

        resolve({
          "status": true,
        });
      });
    }
  }

  saveCallHistory(callhistories) {
    let totalHistoriesToSave = callhistories.length;
    let totalHistorySaved = 0;

    for (let history of callhistories) {
      if (typeof history !== "undefined" && history != null) {
        if (history.contactidlocal == 0) {
          this.findContact(history.contactid).then((contact) => {
            if (contact != null) {
              history.contactidlocal = contact["localid"];
              this.performCallHistoryOperation(history).then((data) => {
                totalHistorySaved++;
                this.publishAllHistorySaved(totalHistorySaved, totalHistoriesToSave);
              });
            }
          });
        } else {
          this.performCallHistoryOperation(history).then((data) => {
            totalHistorySaved++;
            this.publishAllHistorySaved(totalHistorySaved, totalHistoriesToSave);
          });
        }
      }
    }
  }

  publishAllHistorySaved(totalHistorySaved, totalHistoriesToSave) {
    if (totalHistorySaved == totalHistoriesToSave) {
      this.events.publish("histories:saved", {});
    }
  }

  performCallHistoryOperation(history) {
    return new Promise((resolve) => {
      this.findHistory(history.id).then((retrivedhistory) => {
        if (retrivedhistory == null) {
          this.insertCallHistory(history).then((data) => {
            resolve(data);
          });
        } else {
          this.updateCallHistory(history).then((data) => {
            resolve(data);
          });
        }
      });
    });
  }

  performFavouriteOperation(favourite, validFavouritesToPerform) {

    return new Promise((resolve) => {
      this.findFavourite(favourite.id).then((retrivedfavourite) => {
        if (retrivedfavourite == null) {

          this.insertFavourite(favourite).then((data) => {
            resolve();
          });
        } else {
          this.updateFavourite(favourite).then((data) => {
            resolve();
          });
        }
      });
    });
  }

  publishIfAllFavouritesDone(validFavouritesToPerform, favouriteperformed, resolve) {
    if (favouriteperformed == validFavouritesToPerform) {
      this.events.publish("favourites:saved", {});
      resolve({
        "status": true
      });
    }
  }

  insertOrUpdateFavouriteContact(contact) {

    return new Promise((resolve) => {
      let favourite = new Favourite();
      favourite.id = 0;
      favourite.contact = contact;
      favourite.contactid = contact.id;
      favourite.contactidlocal = contact.localid;
      favourite.localid = 0;

      this.findFavouriteByContact(contact.localid).then((retrivedfavourite) => {
        if (retrivedfavourite == null) {
          this.insertFavourite(favourite, true).then((data) => {
            resolve(data);
          });
        } else {
          favourite.id = retrivedfavourite["id"];
          favourite.localid = retrivedfavourite["localid"];
          favourite.contact = null;
          favourite.isdeleted = 0;
          this.updateFavourite(favourite, true).then((data) => {
            resolve(data);
          });
        }
      });
    });

  }

  deleteSyncData() {
    return new Promise(resolve => {

      let totalremoved = 0;
      let deletetables = ["sync", "favourites", "histories", "locationtypes", "contacts", "emails", "contactgroups", "activities", "activitytypes"];
      let tablestoremove = deletetables.length;
      for (let i = 0; i < tablestoremove; i++) {
        this.database.executeSql('DELETE FROM ' + deletetables[i] + ' WHERE 1;', [])
          .then(result => {
            totalremoved++;
            this.resolveSyncDeleteIfNeeded(totalremoved, resolve, tablestoremove);
          })
          .catch(error => {
            resolve({
              "status": false
            });
          });
      }
    });
  }

  resolveSyncDeleteIfNeeded(totalremoved, resolve, tablestoremove) {
    if (totalremoved == tablestoremove) {
      resolve({
        "status": true
      });
    }
  }

  getSyncInfo() {
    return new Promise((resolve) => {
      this.database.executeSql('SELECT * FROM sync;', [])
        .then(result => {

          let syncinfo = null;
          if (result.rows.length == 1) {
            syncinfo = result.rows.item(0);
            if (syncinfo["ccaforcessl"] == "1") {
              let restendpoint = syncinfo["restendpoint"];
              if (restendpoint.startsWith("http://")) {
                restendpoint = restendpoint.replace("http://", "https://");
                syncinfo["restendpoint"] = restendpoint;
              }
            }
          }

          resolve({
            "status": (result.rows.length == 1) ? true : false,
            "info": syncinfo,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "info": null,
          });
        });
    });
  }

  insertSyncData(data) {
    return new Promise((resolve) => {
      this.database.executeSql('INSERT INTO sync(contactid, contactname, apikey, sitekey, restendpoint, lastpulldatetime, lastpushdatetime, defaultgroupid, domainname, google_analytics_id) VALUES(?,?,?,?,?,?,?,?,?,?)', [
        data.contact_id,
        data.contact_name,
        data.api_key,
        data.site_key,
        data.rest_end_point,
        "",
        "",
        data.groupid,
        data.domain_name,
        data.cca_client_google_analytics
      ])
        .then(result => {
          this.googleAnalytics.setUserId(data.contact_id).then((data) => {

          });
          resolve({
            "status": true
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false
          });
        });
    });
  }

  insertGroup(group) {
    return new Promise((resolve) => {
      this.database.executeSql('INSERT INTO contactgroups(liveid, name) VALUES (?,?)', [
        group.id,
        group.name,
      ])
        .then(result => {

          group.localid = result.insertId;
          this.events.publish("group:inserted", {
            "group": group,
          });

          resolve({
            "status": true,
            "group": group,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));

          resolve({
            "status": false
          });
        });
    });
  }

  deleteGroup(groupid) {
    return new Promise((resolve) => {
      this.database.executeSql('UPDATE contactgroups SET isdeleted = ? WHERE liveid = ?', [
        1,
        groupid,
      ])
        .then(result => {
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
          });
        });
    });
  }

  updateGroup(group) {
    return new Promise((resolve) => {
      this.database.executeSql('UPDATE contactgroups SET name = ?, isdeleted = ? WHERE liveid = ?', [
        group.name,
        group.isdeleted,
        group.id,
      ])
        .then(result => {

          this.events.publish("groups:updated", {
            "status": true
          });

          resolve({
            "status": true,
            "group": group,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "group": null,
          });
        });
    });
  }

  insertCallHistory(history, fromdevice = false) {
    return new Promise((resolve) => {
      if (history.contactid == '') {
        return;
      }

      let isuploaded = 1;
      if (fromdevice) {
        isuploaded = 0;
        history.createddate = "";
        history.modifieddate = "";
      }

      this.database.executeSql('INSERT INTO histories(activitydatetime, createddate, modifieddate, contactid, contactidlocal, isuploaded, duration, details, liveid) VALUES (?,?,?,?,?,?,?,?,?)', [
        history.activitydatetime,
        history.createddate,
        history.modifieddate,
        history.contactid,
        history.contactidlocal,
        isuploaded,
        history.duration,
        history.details,
        history.id,
      ])
        .then(result => {

          this.events.publish("callhistory:inserted", {
            "history": history,
            "fromdevice": fromdevice,
          });

          history.localid = result.insertId;
          resolve({
            "status": true,
            "history": history,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false
          });
        });
    });
  }

  /**
   * Update the record based on ID
   * @param email
   */
  updateCiviEmail(email) {
    return new Promise((resolve) => {
      this.database.executeSql('UPDATE emails SET name = ?, username = ?, domain = ?, liveid = ? WHERE id = ?', [
        email.name,
        email.username,
        email.domain,
        email.id,
        email.localid,
      ])
        .then(result => {
          resolve({
            "status": true,
            "email": email,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "email": null,
          });
        });
    });
  }

  /**
   * Insert new record
   * @param email
   */
  insertCiviEmail(email) {
    return new Promise((resolve) => {
      this.database.executeSql('INSERT INTO emails(name, username, domain, liveid) VALUES (?,?,?,?)', [
        email.name,
        email.username,
        email.domain,
        email.id,
      ])
        .then(result => {
          resolve({
            "status": true,
            "email": email,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "email": null,
          });
        });
    });
  }

  insertActivityType(activitytype) {
    return new Promise((resolve) => {

      this.database.executeSql('INSERT INTO activitytypes(label, value, name, isactive, icon, liveid) VALUES (?,?,?,?,?,?)', [
        activitytype.label,
        activitytype.value,
        activitytype.name,
        activitytype.isactive,
        activitytype.icon,
        activitytype.id,
      ])
        .then(result => {
          activitytype.localid = result.insertId;

          this.events.publish("activitytype:inserted", {
            "activitytype": activitytype,
          });

          resolve({
            "status": true,
            "result": result,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "result": null,
          });
        });
    });
  }

  updateActivityType(activitytype) {
    return new Promise((resolve) => {

      this.database.executeSql('UPDATE activitytypes SET label =?, value=?, name=?, isactive=?, icon=? WHERE liveid=?', [
        activitytype.label,
        activitytype.value,
        activitytype.name,
        activitytype.isactive,
        activitytype.icon,
        activitytype.id,
      ])
        .then(result => {

          this.events.publish("activitytype:updated", {
            "activitytype": activitytype,
          });

          resolve({
            "status": true,
            "result": result,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "result": null,
          });
        });
    });
  }

  /**
   * Add activity
   * If the activity is from App, isuploaded will be set to to false.
   * Then the activity will be pushed on next sync
   * @param activity
   * @param fromdevice
   */
  insertActivity(activity, fromdevice = false) {
    return new Promise((resolve) => {

      let isuploaded = 1;
      if (fromdevice) {
        isuploaded = 0;
      }

      this.database.executeSql('INSERT INTO activities(activitytypeid, subject, activitydatetime, sourcecontactid, targetcontactids, assigneecontactids, sourcecontactidlocal , targetcontactidslocal , assigneecontactidslocal, details, createddate, modifieddate, liveid, isuploaded) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        activity.activitytypeid,
        activity.subject,
        activity.activitydatetime,
        activity.sourcecontactid,
        activity.targetcontactids,
        activity.assigneecontactids,
        activity.sourcecontactidlocal,
        activity.targetcontactidslocal,
        activity.assigneecontactidslocal,
        activity.details,
        activity.createddate,
        activity.modifieddate,
        activity.id,
        isuploaded,
      ])
        .then(result => {

          activity.localid = result.insertId;

          this.events.publish("activity:inserted", {
            "activity": activity,
            "fromdevice": fromdevice,
          });

          resolve({
            "status": true,
            "activity": activity,
            "result": result,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "result": null,
          });
        });
    });
  }

  updateActivity(activity, fromdevice = false, refreshLocalInstaces = false) {
    return new Promise((resolve) => {

      let isuploaded = 1;
      if (fromdevice) {
        isuploaded = 0;
      }

      let idkey = "liveid";
      let idvalue = activity.id;
      if (fromdevice || (typeof activity.updatingfrompush !== "undefined" && activity.updatingfrompush)) {
        idkey = "id";
        idvalue = activity.localid;
      }

      let queryParams = [
        activity.activitytypeid,
        activity.subject,
        activity.activitydatetime,
        activity.sourcecontactid,
        activity.targetcontactids,
        activity.assigneecontactids,
        activity.details,
        activity.createddate,
        activity.modifieddate,
        activity.id,
        isuploaded,
      ];

      let localInstancesQuery = "";
      if (refreshLocalInstaces) {
        localInstancesQuery = ", sourcecontactidlocal =?, targetcontactidslocal =?, assigneecontactidslocal =?";
        queryParams.push("");
        queryParams.push("");
        queryParams.push("");
      }

      queryParams.push(idvalue);

      this.database.executeSql('UPDATE activities SET activitytypeid =?, subject=?, activitydatetime=?, sourcecontactid=?, targetcontactids=?, assigneecontactids = ?, details = ?, createddate=?, modifieddate=?, liveid=?, isuploaded=?' + localInstancesQuery + '  WHERE ' + idkey + ' = ?', queryParams)
        .then(result => {

          this.events.publish("activity:updated", {
            "activity": activity,
            "isfromdevice": fromdevice,
          });

          resolve({
            "status": true,
            "result": result,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "result": null,
          });
        });
    });
  }

  insertLocationType(locationtype) {
    this.database.executeSql('INSERT INTO locationtypes(name, displayname, vcardname, description, isdefault, liveid) VALUES (?,?,?,?,?,?)', [
      locationtype.name,
      locationtype.displayname,
      locationtype.vcardname,
      locationtype.description,
      locationtype.isdefault,
      locationtype.id,
    ])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  /**
   * Update lcaotion type record based on ID
   * @param locationtype
   */
  updateLocationType(locationtype) {
    this.database.executeSql('UPDATE locationtypes SET name = ?, displayname = ?, vcardname = ?, description = ?, isdefault = ? WHERE liveid = ?', [
      locationtype.name,
      locationtype.displayname,
      locationtype.vcardname,
      locationtype.description,
      locationtype.isdefault,
      locationtype.id,
    ])
      .then(result => {

      })
      .catch(error => {
        console.log(JSON.stringify(error));
      });
  }

  insertFavourite(favourite, fromdevice = false) {

    return new Promise((resolve) => {
      if (favourite.contactid == '') {
        return;
      }

      let isuploaded = 1;
      if (fromdevice) {
        isuploaded = 0;
      }

      this.database.executeSql('INSERT INTO favourites(contactid, contactidlocal, isuploaded, liveid) VALUES (?,?,?,?)', [
        favourite.contactid,
        favourite.contactidlocal,
        isuploaded,
        favourite.id,
      ])
        .then(result => {
          this.events.publish("contact:favourited", {
            "contactid": favourite.contactidlocal,
            "isfromdevice": fromdevice,
          });
          resolve({
            "status": true,
            "favourite": favourite
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "error": error
          });
        });
    });
  }

  updateCallHistory(history, fromdevice = false, detailsonly = false) {
    return new Promise((resolve) => {
      if (history.contactid == '') {
        return;
      }

      let isuploaded = 1;
      if (fromdevice) {
        isuploaded = 0;
      }

      let idkey = "liveid";
      let idvalue = history.id;
      if (fromdevice || (typeof history.updatingfrompush !== "undefined" && history.updatingfrompush)) {
        idkey = "id";
        idvalue = history.localid;
      }

      let liveidquery = "";
      if (!detailsonly) {
        liveidquery = ", liveid = ?"
      }

      let historyParams = [
        history.activitydatetime,
        history.createddate,
        history.modifieddate,
        history.contactid,
        history.contactidlocal,
        isuploaded,
        history.duration,
        history.details,
      ];

      if (!detailsonly) {
        historyParams.push(history.id);
      }

      historyParams.push(idvalue);

      this.database.executeSql('UPDATE histories SET activitydatetime =?, createddate= ?, modifieddate= ?, contactid= ?, contactidlocal= ?, isuploaded= ?, duration = ?, details = ?' + liveidquery + ' WHERE ' + idkey + ' = ?', historyParams)
        .then(result => {

          this.events.publish("callhistory:updated", {
            "history": history,
            "fromdevice": fromdevice,
          });

          resolve({
            "status": true,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
          });
        });
    });
  }

  getFavouritesToPush() {
    return new Promise(resolve => {
      this.database.executeSql("SELECT F.id favouriteid, F.contactid, C.id contactlocalid, C.liveid contactliveid, C.firstname, C.lastname, C.sortname, C.imageurl, C.colorclass, C.isfavourite, C.phones, C.emails, F.isuploaded favouritesuploaded from favourites F JOIN contacts C ON F.contactidlocal = C.id WHERE F.isdeleted = 0 AND C.isdeleted = 0 AND F.isuploaded = 0", [])
        .then(result => {
          this.resolveFavouritesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  getFavouritesToRemove() {
    return new Promise(resolve => {
      this.database.executeSql("SELECT F.id favouriteid, F.contactid, C.id contactlocalid, C.liveid contactliveid, C.firstname, C.lastname, C.sortname, C.imageurl, C.colorclass, C.isfavourite, C.phones, C.emails from favourites F JOIN contacts C ON F.contactidlocal = C.id WHERE F.isdeleted = 1 AND C.isdeleted = 0 AND F.isuploaded = 0", [])
        .then(result => {
          this.resolveFavouritesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  updateFavouriteBitInContact(contact) {
    return new Promise((resolve) => {
      this.database.executeSql('UPDATE contacts SET isfavourite = 0 WHERE id = ?', [
        contact.localid,
      ])
        .then(result => {

          contact.isfavourite = 0;
          this.events.publish("contact:updated", {
            "contact": contact,
            "fromdevice": true
          });

          resolve({
            "status": true
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": true,
            "error": error,
          });
        });
    });
  }

  unFavouriteContact(keyid, isByContactId) {

    let keyname = "id";
    if (isByContactId) {
      keyname = "contactidlocal";
    }

    return new Promise((resolve) => {
      this.database.executeSql('UPDATE favourites SET isuploaded = 0, isdeleted = 1 WHERE ' + keyname + ' = ?', [
        keyid,
      ])
        .then(result => {

          this.events.publish("contact:unfavourited", {
            "contactid": keyid,
            "fromdevice": true,
            "isbycontactid": isByContactId,
          });

          resolve({
            "status": true
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": true,
            "error": error,
          });
        });
    });
  }

  updateFavourite(favourite, fromdevice = false) {
    return new Promise((resolve) => {
      if (favourite.contactid == '') {
        return;
      }

      let isuploaded = 1;
      if (fromdevice) {
        isuploaded = 0;
      }

      let idkey = "liveid";
      let idvalue = favourite.id;
      if (fromdevice || (typeof favourite.updatingfrompush !== "undefined" && favourite.updatingfrompush)) {
        idkey = "id";
        idvalue = favourite.localid;
      }

      this.database.executeSql('UPDATE favourites SET contactid =?, contactidlocal = ?, isuploaded = ?, isdeleted = ?, liveid = ? WHERE ' + idkey + ' = ?', [
        favourite.contactid,
        favourite.contactidlocal,
        isuploaded,
        favourite.isdeleted,
        favourite.id,
        idvalue,
      ])
        .then(result => {
          this.events.publish("contact:favourited", {
            "contactid": favourite.contactidlocal,
            "isfromdevice": fromdevice,
          });
          resolve({
            "status": true,
            "favourite": favourite
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": true,
            "error": error
          });
        });
    });
  }

  saveProfileFieldsData(contact) {
    return new Promise((resolve) => {

      let totalprofilefieldsdatatoperform = contact.profilefieldsdata.length;
      if (totalprofilefieldsdatatoperform == 0) {
        resolve({
          "status": true,
        });
      }

      let totalprofilefieldsdataperformed = 0;

      for (let profilefielddata of contact.profilefieldsdata) {
        this.findProfileFieldData(profilefielddata.fieldname, profilefielddata.contactid).then((fetchedprofilefieldsdata) => {
          if (fetchedprofilefieldsdata["length"] == 0) {
            this.insertProfileFieldData(profilefielddata).then((data) => {
              totalprofilefieldsdataperformed++;
              this.resolveIfAllProfileDataPerformed(totalprofilefieldsdatatoperform, totalprofilefieldsdataperformed, resolve);
            });
          } else {
            let fetchedprofilefielddata = fetchedprofilefieldsdata[0];
            profilefielddata.id = fetchedprofilefielddata.id;
            profilefielddata.contactidlocal = fetchedprofilefielddata.contactidlocal;
            profilefielddata.contactid = fetchedprofilefielddata.contactid;

            this.updateProfileFieldData(profilefielddata).then((data) => {
              totalprofilefieldsdataperformed++;
              this.resolveIfAllProfileDataPerformed(totalprofilefieldsdatatoperform, totalprofilefieldsdataperformed, resolve);
            });
          }
        });
      }
    });
  }

  resolveIfAllProfileDataPerformed(totalprofilefieldsdatatoperform, totalprofilefieldsdataperformed, resolve) {
    if (totalprofilefieldsdatatoperform == totalprofilefieldsdataperformed) {
      resolve({
        "status": true,
      });
    }
  }

  insertProfileFieldData(profilefielddata) {
    return new Promise((resolve) => {
      this.database.executeSql("INSERT INTO profilefieldsdata(contactid, contactidlocal, fieldname, value, label) values(?, ?, ?, ?, ?)", [
        profilefielddata.contactid,
        profilefielddata.contactidlocal,
        profilefielddata.fieldname,
        profilefielddata.value,
        profilefielddata.label,
      ])
        .then(result => {
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  updateProfileFieldData(profilefielddata) {
    return new Promise((resolve) => {
      this.database.executeSql("UPDATE profilefieldsdata SET contactid = ?, contactidlocal = ?, fieldname = ?, value =?, label =? WHERE id = ?", [
        profilefielddata.contactid,
        profilefielddata.contactidlocal,
        profilefielddata.fieldname,
        profilefielddata.value,
        profilefielddata.label,
        profilefielddata.id,
      ])
        .then(result => {
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  findProfileFieldsDataByContact(contactid, findbylocal = false, findkeyval = false) {
    let contactkeytofind = 'contactid';
    if (findbylocal) {
      contactkeytofind = 'contactidlocal';
    }

    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM profilefieldsdata WHERE " + contactkeytofind + " = ?", [
        contactid,
      ])
        .then(result => {
          this.resolveProfileFieldDataResult(result, resolve, findkeyval);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findProfileFieldData(fieldname, contactid, findbylocal = false) {
    let contactkeytofind = 'contactid';
    if (findbylocal) {
      contactkeytofind = 'contactidlocal';
    }

    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM profilefieldsdata WHERE " + contactkeytofind + " = ? AND fieldname = ?", [
        contactid,
        fieldname,
      ])
        .then(result => {
          this.resolveProfileFieldDataResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  resolveProfileFieldDataResult(result, resolve, findkeyval: boolean = false) {
    let totalprofilefieldsdata = result.rows.length;
    let profilefieldsdataarray = new Array<Profilefielddata>();

    let profilefieldsdataobject = {};

    for (let i = 0; i < totalprofilefieldsdata; i++) {

      let profilefielddatainfo = result.rows.item(i);
      let profileFieldsData = new Profilefielddata();
      profileFieldsData.fieldname = profilefielddatainfo["fieldname"];
      profileFieldsData.contactid = profilefielddatainfo["contactid"];
      profileFieldsData.contactidlocal = profilefielddatainfo["contactidlocal"];
      profileFieldsData.value = profilefielddatainfo["value"];
      profileFieldsData.label = profilefielddatainfo["label"];
      profileFieldsData.id = profilefielddatainfo["id"];

      profilefieldsdataobject[profilefielddatainfo["fieldname"]] = {
        'value': profilefielddatainfo["value"],
        'label': profilefielddatainfo["label"],
        'contactid': profilefielddatainfo["contactid"],
        'contactidlocal': profilefielddatainfo["contactidlocal"],
        'fieldname': profilefielddatainfo["fieldname"],
        'id': profilefielddatainfo["id"],
      };

      profilefieldsdataarray.push(profileFieldsData);
    }

    if (findkeyval) {
      resolve(profilefieldsdataobject);
    } else {
      resolve(profilefieldsdataarray);
    }
  }

  insertContact(contact, fromdevice = false) {

    return new Promise((resolve) => {

      let isuploaded = 1;
      if (fromdevice) {
        isuploaded = 0;
      }

      this.database.executeSql('INSERT INTO contacts(imageurl, firstname, lastname, sortname, createddate, modifieddate, isfavourite, colorclass, isuploaded, isdeleted, phones, emails, liveid, groups) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        contact.imageurl,
        contact.firstname,
        contact.lastname,
        contact.sortname,
        contact.createddate,
        contact.modifieddate,
        contact.isfavourite,
        contact.colorclass,
        isuploaded,
        0,
        JSON.stringify(contact.phones),
        JSON.stringify(contact.emails),
        contact.id,
        contact.groups
      ])
        .then(result => {
          contact.localid = result.insertId;

          this.events.publish("contact:inserted", {
            "contact": contact,
            "fromdevice": fromdevice,
          });

          resolve({
            "status": true,
            "contact": contact,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "error": error
          });
        });
    });
  }

  deleteContact(contact) {
    return new Promise((resolve) => {
      let contactid = contact.localid;

      this.database.executeSql('UPDATE contacts SET isdeleted = 1, isuploaded = 0 WHERE id = ?', [
        contactid,
      ])
        .then(result => {

          this.events.publish("contact:deleted", {
            "contactid": contactid
          });

          resolve({
            "status": true
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "error": error,
          });
        });
    });
  }

  updateContact(contact, fromdevice = false) {
    return new Promise((resolve) => {
      let isuploaded = 1;
      if (fromdevice) {
        isuploaded = 0;
      }
      let idkey = "liveid";
      let idvalue = contact.id;
      if (fromdevice || (typeof contact.updatingfrompush !== "undefined" && contact.updatingfrompush)) {
        idkey = "id";
        idvalue = contact.localid;
      }

      this.database.executeSql('UPDATE contacts SET imageurl = ?, firstname= ?, lastname= ?, sortname=?, createddate= ?, modifieddate= ?, isfavourite= ?, isuploaded= ?, isdeleted= ?, phones= ?, emails= ?, liveid= ?, groups= ? WHERE ' + idkey + ' = ?', [
        contact.imageurl,
        contact.firstname,
        contact.lastname,
        contact.sortname,
        contact.createddate,
        contact.modifieddate,
        contact.isfavourite,
        isuploaded,
        contact.isdeleted,
        JSON.stringify(contact.phones),
        JSON.stringify(contact.emails),
        contact.id,
        contact.groups,
        idvalue,
      ])
        .then(result => {
          this.events.publish("contact:updated", {
            "contact": contact,
            "fromdevice": fromdevice
          });

          resolve({
            "status": true,
            "contact": contact,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
            "error": error,
          });
        });
    });
  }

  activateLastAccount() {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("UPDATE accounts SET isactive = ? WHERE id = (SELECT MAX(id) FROM accounts)", [
        1,
      ])
        .then(result => {
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
          });
        });
    });
  }

  makeAccountActive(account) {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("UPDATE accounts SET isactive = ? WHERE contact_id = ?", [
        1,
        account.contact_id,
      ])
        .then(result => {
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  makeOtherAccountsInActive(jsondata) {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("UPDATE accounts SET isactive = ? WHERE contact_id != ?", [
        0,
        jsondata.contact_id,
      ])
        .then(result => {
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  addAccount(jsondata) {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("INSERT INTO accounts(contact_id, contact_name, api_key, site_key, rest_end_point, isactive, defaultgroupid) values(?, ?, ?, ?, ?, ?, ?)", [
        jsondata.contact_id,
        jsondata.contact_name,
        jsondata.api_key,
        jsondata.site_key,
        jsondata.rest_end_point,
        1,
        jsondata.groupid,
      ])
        .then(result => {
          resolve({
            "status": true,
            "result": result
          });
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  getAccounts() {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("SELECT * FROM accounts A", [])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let totalaccounts = result.rows.length;
            let accounts = [];
            for (let i = 0; i < totalaccounts; i++) {
              let accountinfo = result.rows.item(i);
              accounts.push(accountinfo);
            }
            resolve(accounts);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve([]);
        });
    });
  }

  deleteAccount(id) {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("DELETE FROM accounts WHERE id = ?", [
        id,
      ])
        .then(result => {
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
          });
        });
    });
  }

  deleteActiveAccount() {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("DELETE FROM accounts WHERE isactive = ?", [
        1,
      ])
        .then(result => {
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
          });
        });
    });
  }

  getActiveAccount() {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("SELECT * FROM accounts A WHERE A.isactive = ?", [
        1,
      ])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let accountinfo = result.rows.item(0);
            resolve(accountinfo);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve(null);
        });
    });
  }

  findAccount(jsondata) {
    return new Promise(resolve => {
      this.masterdatabase.executeSql("SELECT * FROM accounts A WHERE A.contact_id = ? AND A.rest_end_point = ?", [
        jsondata.contact_id,
        jsondata.rest_end_point,
      ])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let accountinfo = result.rows.item(0);
            resolve(accountinfo);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve(null);
        });
    });
  }

  getCiviEmails() {
    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM emails", [])
        .then(result => {
          this.resolveEmailsResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  resolveEmailsResult(result, resolve) {
    let emails = new Array<CiviEmail>();
    let totalemails = result.rows.length;
    for (let i = 0; i < totalemails; i++) {
      let emailrow = result.rows.item(i);
      let civiEmail = new CiviEmail();
      civiEmail.domain = emailrow["domain"];
      civiEmail.id = emailrow["liveid"];
      civiEmail.localid = emailrow["id"];
      civiEmail.name = emailrow["name"];
      civiEmail.username = emailrow["username"];
      emails.push(civiEmail);
    }
    resolve(emails);
  }

  getContactsCountOfGroup(groupliveid) {
    return new Promise(resolve => {
      this.database.executeSql("SELECT count(id) contactscount FROM contacts WHERE isdeleted = 0 AND firstname != '' AND ((groups LIKE '%," + groupliveid + ",%') OR (groups LIKE '" + groupliveid + ",%') OR (groups LIKE '%," + groupliveid + "') OR (groups LIKE '" + groupliveid + "'))", [])
        .then(result => {
          let item = result.rows.item(0);
          resolve(item["contactscount"]);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });

  }

  getGroupContacts(groupid) {
    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM contacts WHERE isdeleted = 0 AND ((groups LIKE '%," + groupid + ",%') OR (groups LIKE '" + groupid + ",%') OR (groups LIKE '%," + groupid + "') OR (groups LIKE '" + groupid + "')) ORDER BY firstname ASC", [])
        .then(result => {
          this.resolveContactsResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  searchContacts(searchterm) {
    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM contacts WHERE isdeleted = 0 AND ((firstname || ' ' || lastname) LIKE '%" + searchterm + "%' OR (sortname) LIKE '%" + searchterm + "%') ORDER BY firstname ASC LIMIT ? COLLATE NOCASE", [
        5,
      ])
        .then(result => {
          this.resolveContactsResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  resolveActivitiesResult(result, resolve) {
    let activities = new Array<Activity>();
    let totalactivities = result.rows.length;

    for (let i = 0; i < totalactivities; i++) {
      let activity = this.getActivityFromSQLRow(result.rows.item(i));
      activities.push(activity);
    }

    console.log(activities.length + " activities found.");

    resolve(activities);
  }

  resolveActivityTypesResult(result, resolve) {
    let activityTypes = new Array<ActivityType>();
    let totalactivitytypes = result.rows.length;

    for (let i = 0; i < totalactivitytypes; i++) {
      let activitytype = this.getActivityTypeFromSQLRow(result.rows.item(i));
      activityTypes.push(activitytype);
    }

    console.log(activityTypes.length + " activitytypes found.");
    resolve(activityTypes);
  }

  resolveContactsResult(result, resolve, fetchprofilefieldsdata = false) {
    let contacts = new Array<Contact>();
    let totalcontacts = result.rows.length;

    let contactsresolved = 0;

    for (let i = 0; i < totalcontacts; i++) {
      let contact = this.getContactFromSQLRow(result.rows.item(i));
      if (fetchprofilefieldsdata) {
        let findbycontactid = (contact.id) ? contact.id : contact.localid;
        let findbylocal = (contact.id) ? false : true;
        this.findProfileFieldsDataByContact(findbycontactid, findbylocal).then((data) => {
          contact.profilefieldsdata = <Array<Profilefielddata>>data;
          contacts.push(contact);
          contactsresolved++;
          if (contactsresolved == totalcontacts) {
            console.log(contacts.length + " contacts found.");
            resolve(contacts);
          }
        });
      } else {
        contacts.push(contact);
      }
    }

    if (!fetchprofilefieldsdata || totalcontacts == 0) {
      console.log(contacts.length + " contacts found.");
      resolve(contacts);
    }
  }

  resolveCallHistoriesResult(result, resolve) {
    let callhistories = new Array<CallHistory>();
    let totalhistories = result.rows.length;
    for (let i = 0; i < totalhistories; i++) {
      let callhistory = this.getCallHistoryFromSQLRow(result.rows.item(i));
      callhistories.push(callhistory);
    }
    console.log(callhistories.length + " call history found.");
    resolve(callhistories);
  }

  resolveFavouritesResult(result, resolve) {
    let favourites = new Array<Favourite>();
    let totalfavourites = result.rows.length;
    for (let i = 0; i < totalfavourites; i++) {
      let favourite = this.getFavouriteFromSQLRow(result.rows.item(i));
      favourites.push(favourite);
    }
    console.log(favourites.length + " favourites found.");
    resolve(favourites);
  }

  getAllContacts(pagenumber = 0, groupid = 0) {
    return new Promise(resolve => {
      let offset = pagenumber * this.PAGE_ROW_LIMIT;

      let groupsSql = "";
      if (groupid != 0) {
        groupsSql = " AND ((groups LIKE '%," + groupid + ",%') OR (groups LIKE '" + groupid + ",%') OR (groups LIKE '%," + groupid + "') OR (groups LIKE '" + groupid + "')) ";
      }

      this.database.executeSql("SELECT * FROM contacts WHERE isdeleted = 0 AND firstname != '' " + groupsSql + " ORDER BY firstname ASC, lastname ASC LIMIT ? OFFSET ?", [
        this.PAGE_ROW_LIMIT,
        offset
      ])
        .then(result => {
          this.resolveContactsResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  getCallHistoryToPush() {
    return new Promise(resolve => {
      this.database.executeSql("SELECT H.id historyid, H.activitydatetime, H.contactid, H.createddate, H.liveid, H.modifieddate, H.duration, H.details, C.id contactlocalid, C.liveid contactliveid, C.firstname, C.lastname, C.sortname, C.imageurl, C.colorclass, C.isfavourite, C.phones, C.emails from histories H JOIN contacts C ON H.contactidlocal = C.id WHERE C.isdeleted = 0 AND H.isuploaded = 0", [])
        .then(result => {
          this.resolveCallHistoriesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  getContactsToPush() {
    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM contacts WHERE isuploaded = 0", [])
        .then(result => {
          this.resolveContactsResult(result, resolve, true);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findActivitiesOfContact(contactid, isbyliveid = false, inDecending = true) {

    let sourcekey = "sourcecontactidlocal";
    let targetkey = "targetcontactidslocal";
    let assigneekey = "assigneecontactidslocal";

    if (isbyliveid) {
      sourcekey = "sourcecontactid";
      targetkey = "targetcontactids";
      assigneekey = "assigneecontactids";
    }

    let sortQuery = " ORDER BY activitydatetime ASC";
    if (inDecending) {
      sortQuery = " ORDER BY activitydatetime DESC";
    }

    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM activities WHERE (" + sourcekey + " = " + contactid + ") OR (" + targetkey + " = " + contactid + " OR " + targetkey + " LIKE '%\"" + contactid + "\"%' OR " + targetkey + " LIKE '%," + contactid + ",%' OR " + targetkey + " LIKE '%[" + contactid + "]%' OR " + targetkey + " LIKE '%[\"" + contactid + "\"]%' OR " + targetkey + " LIKE '[" + contactid + ",%' OR " + targetkey + " LIKE '%," + contactid + "]') OR (" + assigneekey + " = " + contactid + " OR " + assigneekey + " LIKE '%\"" + contactid + "\"%' OR " + assigneekey + " LIKE '%," + contactid + ",%' OR " + assigneekey + " LIKE '%[" + contactid + "]%' OR " + assigneekey + " LIKE '%[\"" + contactid + "\"]%' OR " + assigneekey + " LIKE '[" + contactid + ",%' OR " + assigneekey + " LIKE '%," + contactid + "]') " + sortQuery, [])
        .then(result => {
          console.log("SELECT * FROM activities WHERE (" + sourcekey + " = " + contactid + ") OR (" + targetkey + " = " + contactid + " OR " + targetkey + " LIKE '%\"" + contactid + "\"%' OR " + targetkey + " LIKE '%," + contactid + ",%' OR " + targetkey + " LIKE '%[" + contactid + "]%' OR " + targetkey + " LIKE '%[\"" + contactid + "\"]%' OR " + targetkey + " LIKE '[" + contactid + ",%' OR " + targetkey + " LIKE '%," + contactid + "]') OR (" + assigneekey + " = " + contactid + " OR " + assigneekey + " LIKE '%\"" + contactid + "\"%' OR " + assigneekey + " LIKE '%," + contactid + ",%' OR " + assigneekey + " LIKE '%[" + contactid + "]%' OR " + assigneekey + " LIKE '%[\"" + contactid + "\"]%' OR " + assigneekey + " LIKE '[" + contactid + ",%' OR " + assigneekey + " LIKE '%," + contactid + "]') " + sortQuery);
          this.resolveActivitiesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findAllActivities() {

    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM activities", [])
        .then(result => {
          this.resolveActivitiesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  getActivitiesToPush() {
    return new Promise(resolve => {
      this.database.executeSql("SELECT * FROM activities WHERE isuploaded = 0", [])
        .then(result => {
          this.resolveActivitiesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  updateLastPullDateTime(timestamp) {
    console.log("Timestamp updated " + timestamp);
    return new Promise(resolve => {
      this.database.executeSql("UPDATE sync SET lastpulldatetime = ? WHERE 1", [
        timestamp
      ])
        .then(result => {
          resolve({
            "status": true,
          })
        })
        .catch(error => {

        });
    });
  }

  updateCountries(countries) {
    let countriestext = JSON.stringify(countries);

    return new Promise(resolve => {
      this.database.executeSql("UPDATE sync SET ccacountries = ? WHERE 1", [
        countriestext
      ])
        .then(result => {
          resolve({
            "status": true,
          })
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  updateContactReferenceInProfileFieldsData(liveid, localid) {
    return new Promise(resolve => {
      this.database.executeSql("UPDATE profilefieldsdata SET contactid = ? WHERE contactidlocal = ?", [
        liveid,
        localid,
      ])
        .then(result => {
          resolve({
            "status": true,
          })
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  updateProfileFields(profilefields) {
    let profilefieldstext = "";
    if (profilefields.length > 0) {
      profilefieldstext = JSON.stringify(profilefields);
    }

    return new Promise(resolve => {
      this.database.executeSql("UPDATE sync SET ccaprofilefields = ? WHERE 1", [
        profilefieldstext
      ])
        .then(result => {
          resolve({
            "status": true,
          })
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  updateEmailToActivity(emailtoactivity) {
    return new Promise(resolve => {
      this.database.executeSql("UPDATE sync SET emailtoactivity = ? WHERE 1", [
        (emailtoactivity) ? 1 : 0
      ])
        .then(result => {
          resolve({
            "status": true,
          })
        })
        .catch(error => {
          resolve({
            "status": false,
          });
        });
    });
  }

  updateGlobalConfig(settings) {
    return new Promise(resolve => {

      let queryParams = [
        settings.useglobalconfig,
      ];
      let queryString = "";
      if ("cca_email_to_activity" in settings && settings.useglobalconfig == "1") {
        queryString += ", emailtoactivity = ?";
        queryParams.push(settings["cca_email_to_activity"]);
      }

      if ("cca_sync_interval" in settings && settings.useglobalconfig == "1") {
        queryString += ", syncinterval = ?";
        queryParams.push(settings["cca_sync_interval"]);
      }

      if ("cca_force_ssl" in settings) {
        queryString += ", ccaforcessl = ?";
        queryParams.push(settings["cca_force_ssl"]);
      }

      if ("cca_contact_tile_click_action" in settings) {
        queryString += ", ccacontacttileclickaction = ?";
        queryParams.push(settings["cca_contact_tile_click_action"]);
      }

      if ("cca_activity_types" in settings) {
        queryString += ", ccaactivitytypes = ?";
        queryParams.push(settings["cca_activity_types"]);
      }

      this.database.executeSql("UPDATE sync SET useglobalconfig = ?" + queryString + " WHERE 1", queryParams)
        .then(result => {
          this.events.publish("sync:globalinfo:updated", {
            "status": true
          });
          resolve({
            "status": true,
          });
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve({
            "status": false,
          });
        });
    });
  }

  updateSyncInterval(value) {
    return new Promise(resolve => {
      this.database.executeSql("UPDATE sync SET syncinterval = ? WHERE 1", [
        value
      ])
        .then(result => {
          resolve({
            "status": true,
          })
        })
        .catch(error => {

        });
    });
  }

  getCallHistory(searchterm = "") {
    return new Promise(resolve => {
      this.database.executeSql("SELECT H.id historyid, H.activitydatetime, H.contactid, H.createddate, H.liveid, H.modifieddate, C.id contactlocalid, C.liveid contactliveid, C.firstname, C.lastname, C.sortname, C.imageurl, C.colorclass, C.isfavourite, C.phones, C.emails from histories H JOIN contacts C ON H.contactidlocal = C.id WHERE C.isdeleted = 0 " + this.getContactFilter(searchterm) + " ORDER BY H.activitydatetime DESC", [])
        .then(result => {
          this.resolveCallHistoriesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  getContactFilter(searchterm) {
    let filterWhere = ""
    if (searchterm != "") {
      filterWhere = " AND ((C.firstname || ' ' || C.lastname) LIKE '%" + searchterm + "%' OR (C.sortname) LIKE '%" + searchterm + "%') ";
    }
    return filterWhere;
  }

  getFavourites(searchterm = "") {
    return new Promise(resolve => {

      this.database.executeSql("SELECT F.id favouriteid, F.contactid, C.id contactlocalid, C.liveid contactliveid, C.firstname, C.lastname, C.sortname, C.imageurl, C.colorclass, C.isfavourite, C.phones, C.emails from favourites F JOIN contacts C ON F.contactidlocal = C.id WHERE F.isdeleted = 0 AND C.isdeleted = 0 " + this.getContactFilter(searchterm) + " ORDER BY F.id DESC", [])
        .then(result => {
          this.resolveFavouritesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  getGroupFromSQLRow(row) {
    let group = new Group();
    group.id = row.liveid;
    group.name = row.name;
    group.localid = row.id;
    return group;
  }

  getActivityTypeFromSQLRow(row) {
    let activitytype = new ActivityType();
    activitytype.icon = row.icon;
    activitytype.id = row.liveid;
    activitytype.isactive = row.isactive;
    activitytype.localid = row.id;
    activitytype.name = row.name;
    activitytype.value = row.value;
    activitytype.label = row.label;
    return activitytype;
  }

  getActivityFromSQLRow(row) {
    let activity = new Activity();
    activity.id = row.liveid;
    activity.targetcontactids = row.targetcontactids;
    activity.assigneecontactids = row.assigneecontactids;
    activity.sourcecontactid = row.sourcecontactid;

    activity.targetcontactidslocal = row.targetcontactidslocal;
    activity.assigneecontactidslocal = row.assigneecontactidslocal;
    activity.sourcecontactidlocal = row.sourcecontactidlocal;

    activity.details = row.details;

    activity.activitytypeid = row.activitytypeid;
    activity.activitydatetime = row.activitydatetime;
    activity.createddate = row.createddate;
    activity.modifieddate = row.modifieddate;
    activity.localid = row.id;
    activity.subject = row.subject;
    return activity;
  }

  getContactFromSQLRow(row) {
    let contact = new Contact();
    contact.colorclass = row.colorclass;
    contact.createddate = row.createddate;
    contact.firstname = row.firstname;
    contact.id = row.liveid;
    contact.localid = row.id;
    contact.imageurl = row.imageurl;
    contact.isfavourite = (row.isfavourite) ? 1 : 0;
    contact.isdeleted = row.isdeleted;
    contact.lastname = row.lastname;
    contact.sortname = row.sortname;
    contact.modifieddate = row.modifieddate;
    contact.groups = row.groups;

    let phones = JSON.parse(row.phones);
    for (let rowphone of phones) {
      let phone = this.getPhoneFromSQLRow(rowphone);
      contact.phones.push(phone);
    }

    let emails = JSON.parse(row.emails);
    for (let rowemail of emails) {
      let email = this.getEmailFromSQLRow(rowemail);
      contact.emails.push(email);
    }
    return contact;
  }

  getCallHistoryFromSQLRow(row) {
    let callhistory = new CallHistory();
    callhistory.activitydatetime = row.activitydatetime;
    callhistory.contactid = row.contactid;
    callhistory.contactidlocal = row.contactlocalid;
    callhistory.createddate = row.createddate;
    callhistory.id = row.liveid;
    callhistory.localid = row.historyid;
    callhistory.modifieddate = row.modifieddate;
    callhistory.duration = row.duration;
    callhistory.details = row.details;

    let contact = new Contact();
    contact.id = row.contactliveid;
    contact.localid = row.contactlocalid;
    contact.firstname = row.firstname;
    contact.lastname = row.lastname;
    contact.sortname = row.sortname;
    contact.imageurl = row.imageurl;
    contact.colorclass = row.colorclass;
    contact.isfavourite = row.isfavourite;

    let phones = JSON.parse(row.phones);
    for (let rowphone of phones) {
      let phone = this.getPhoneFromSQLRow(rowphone);
      contact.phones.push(phone);
    }

    let emails = JSON.parse(row.emails);
    for (let rowemail of emails) {
      let email = this.getEmailFromSQLRow(rowemail);
      contact.emails.push(email);
    }
    callhistory.contact = contact;

    return callhistory;
  }

  getFavouriteFromSQLRow(row) {
    let favourite = new Favourite();
    favourite.contactid = row.contactid;
    favourite.contactidlocal = row.contactlocalid;
    favourite.id = row.liveid;
    favourite.localid = row.favouriteid;

    let contact = new Contact();
    contact.id = row.contactliveid;
    contact.localid = row.contactlocalid;
    contact.firstname = row.firstname;
    contact.lastname = row.lastname;
    contact.imageurl = row.imageurl;
    contact.sortname = row.sortname;
    contact.colorclass = row.colorclass;
    contact.isfavourite = 1;

    let phones = JSON.parse(row.phones);
    for (let rowphone of phones) {
      let phone = this.getPhoneFromSQLRow(rowphone);
      contact.phones.push(phone);
    }

    let emails = JSON.parse(row.emails);
    for (let rowemail of emails) {
      let email = this.getEmailFromSQLRow(rowemail);
      contact.emails.push(email);
    }

    favourite.contact = contact;
    return favourite;
  }

  getLocationTypeFromRow(type, rawfind = false) {
    let locationType = new LocationType();
    locationType.description = type.description;
    locationType.displayname = type.displayname;
    if (rawfind) {
      locationType.id = type.liveid;
      locationType.localid = type.id;
    } else {
      locationType.id = type.id;
    }
    locationType.isdefault = type.isdefault;
    locationType.name = type.name;
    locationType.vcardname = type.vcardname;
    return locationType;
  }

  getCiviEmailFromRow(row) {
    let civiemail = new CiviEmail();
    civiemail.domain = row.domain;
    civiemail.id = row.liveid;
    civiemail.localid = row.id;
    civiemail.name = row.name;
    civiemail.username = row.username;
    return civiemail;
  }

  getPhoneFromSQLRow(rowphone) {
    let locationType = this.getLocationTypeFromRow(rowphone.type);
    let phone = new Phone(rowphone.id, locationType, rowphone.phone);
    return phone;
  }

  getEmailFromSQLRow(rowemail) {
    let locationType = this.getLocationTypeFromRow(rowemail.type);
    let email = new Email(rowemail.id, locationType, rowemail.email);
    return email;
  }

  getAllGroups() {
    return new Promise((resolve) => {
      this.database.executeSql('SELECT * from contactgroups WHERE isdeleted = 0 ORDER BY name ASC', [])
        .then(result => {
          let groups = [];
          let totalgroups = result.rows.length;
          for (var i = 0; i < totalgroups; i++) {
            groups.push(this.getGroupFromSQLRow(result.rows.item(i)));
          }
          console.log("Found " + totalgroups + " groups.");
          resolve(groups);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findActivity(ativityid, isbylocalid = false) {
    return new Promise((resolve) => {

      let idkey = "liveid";
      if (isbylocalid) {
        idkey = "id";
      }

      this.database.executeSql('SELECT * from activities WHERE ' + idkey + ' = ?', [ativityid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let activity = this.getActivityFromSQLRow(result.rows.item(0));
            resolve(activity);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve(null);
        });
    });
  }

  findActivityType(ativitytypeid, isbylocalid = false) {
    return new Promise((resolve) => {

      let idkey = "liveid";
      if (isbylocalid) {
        idkey = "id";
      }

      this.database.executeSql('SELECT * from activitytypes WHERE ' + idkey + ' = ?', [ativitytypeid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let activitytype = this.getActivityTypeFromSQLRow(result.rows.item(0));
            resolve(activitytype);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve(null);
        });
    });
  }

  findAllActivityTypes() {
    return new Promise((resolve) => {

      this.database.executeSql('SELECT * from activitytypes', [])
        .then(result => {
          this.resolveActivityTypesResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve(null);
        });
    });
  }

  findGroup(groupid, isbylocalid = false) {
    return new Promise((resolve) => {

      let idkey = "liveid";
      if (isbylocalid) {
        idkey = "id";
      }

      this.database.executeSql('SELECT * from contactgroups WHERE ' + idkey + ' = ?', [groupid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let group = this.getGroupFromSQLRow(result.rows.item(0));
            resolve(group);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
          resolve(null);
        });
    });
  }

  findContact(contactid, isbylocalid = false) {
    return new Promise((resolve) => {

      let idkey = "liveid";
      if (isbylocalid) {
        idkey = "id";
      }

      this.database.executeSql('SELECT * from contacts WHERE ' + idkey + ' = ?', [contactid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let contact = this.getContactFromSQLRow(result.rows.item(0));
            resolve(contact);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findContacts(contactids, isbylocalid = false) {
    return new Promise((resolve) => {

      let idkey = "liveid";
      if (isbylocalid) {
        idkey = "id";
      }

      this.database.executeSql('SELECT * from contacts WHERE ' + idkey + ' IN (' + contactids + ')', [])
        .then(result => {
          this.resolveContactsResult(result, resolve);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findHistory(historyid) {
    return new Promise((resolve) => {
      this.database.executeSql('SELECT H.id historyid, H.activitydatetime, H.contactid, H.createddate, H.liveid, H.modifieddate, C.id contactlocalid, C.liveid contactliveid, C.firstname, C.lastname, C.sortname, C.imageurl, C.colorclass, C.isfavourite, C.phones, C.emails from histories H JOIN contacts C ON H.contactidlocal = C.id WHERE H.liveid = ?', [historyid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let callhistory = this.getCallHistoryFromSQLRow(result.rows.item(0));
            resolve(callhistory);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findFavourite(favouriteid) {
    return new Promise((resolve) => {
      this.database.executeSql('SELECT F.id favouriteid, F.contactid, C.id contactlocalid, C.liveid contactliveid, C.firstname, C.lastname, C.sortname, C.imageurl, C.colorclass, C.isfavourite, C.phones, C.emails from favourites F JOIN contacts C ON F.contactidlocal = C.id WHERE F.liveid = ?', [favouriteid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let favourite = this.getFavouriteFromSQLRow(result.rows.item(0));
            resolve(favourite);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findFavouriteByContact(contactid) {
    return new Promise((resolve) => {
      this.database.executeSql('SELECT F.id favouriteid, F.contactid, C.id contactlocalid, C.liveid contactliveid, C.firstname, C.lastname, C.sortname, C.imageurl, C.colorclass, C.isfavourite, C.phones, C.emails from favourites F JOIN contacts C ON F.contactidlocal = C.id WHERE F.contactidlocal = ?', [contactid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let favourite = this.getFavouriteFromSQLRow(result.rows.item(0));
            resolve(favourite);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  /**
   * Find email by ID
   * @param emailid
   */
  findCiviEmail(emailid) {
    return new Promise((resolve) => {
      this.database.executeSql('SELECT * from emails E WHERE E.liveid = ?', [emailid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let civiemail = this.getCiviEmailFromRow(result.rows.item(0));
            resolve(civiemail);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  /**
   * Find location type by ID
   * @param locationtypeid
   */
  findLocationType(locationtypeid) {
    return new Promise((resolve) => {
      this.database.executeSql('SELECT * from locationtypes L WHERE L.liveid = ?', [locationtypeid])
        .then(result => {
          if (result.rows.length == 0) {
            resolve(null);
          } else {
            let locationtype = this.getLocationTypeFromRow(result.rows.item(0), true);
            resolve(locationtype);
          }
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  findAllLocationType() {
    return new Promise((resolve) => {
      this.database.executeSql('SELECT * from locationtypes L', [])
        .then(result => {
          let locationtypes = new Array<LocationType>();
          let totallocationtypes = result.rows.length;
          for (let i = 0; i < totallocationtypes; i++) {
            let locationtype = this.getLocationTypeFromRow(result.rows.item(i), true);
            locationtypes.push(locationtype);
          }
          console.log("Found " + locationtypes.length + " location types");
          resolve(locationtypes);
        })
        .catch(error => {
          console.log(JSON.stringify(error));
        });
    });
  }
}
