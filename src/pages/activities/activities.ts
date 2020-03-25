import { Component } from '@angular/core';
import { AlertController, NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from "../../providers/database/database";
import { Activity } from "../../models/activity";
import { UtilsProvider } from "../../providers/utils/utils";
import { Contact } from "../../models/contact";
import { ActivityType } from "../../models/activity-type";

/**
 * Generated class for the ActivitiesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-activities',
  templateUrl: 'activities.html',
})
export class ActivitiesPage {

  private contact: any;
  private activities: any;
  private uniqueContacts: any = [];
  private contactsMap;
  private activityTypes: any = [];
  private activityTypesMap;
  private currentActivitiesSort = 1;
  private activitiesFindCount = 0;
  private currentActivitiesFilter = 0;
  private validActivities = 0;
  private noActivitiesLabel = "Activities not found";

  constructor(public navCtrl: NavController, public navParams: NavParams, private databaseProvider: DatabaseProvider, private alertsController: AlertController, public utilsProvider: UtilsProvider) {
    this.contact = navParams.get('contact');
    this.activities = new Array<Activity>();
    this.uniqueContacts = [];
    this.activityTypes = new Array<ActivityType>();
    this.contactsMap = {};
  }

  ionViewDidLoad() {
    this.utilsProvider.trackPageOpen("Contact Activities");
    this.databaseProvider.findAllActivityTypes().then((activitytypes) => {
      this.activityTypesMap = {};
      this.activityTypes = activitytypes;
      let totalactivityTypes = activitytypes["length"];
      for (let i = 0; i < totalactivityTypes; i++) {
        this.activityTypesMap[activitytypes[i].value] = activitytypes[i];
      }
      this.findActivities();
    });
  }

  findActivities(inDecending: boolean = true) {

    this.databaseProvider.findActivitiesOfContact(this.contact.id, true, inDecending).then((activities) => {
      this.activities = activities;

      let totalActivities = this.activities.length;

      for (let i = 0; i < totalActivities; i++) {

        let activity = this.activities[i];

        if (this.activitiesFindCount == 0) {
          this.uniqueContacts.push(activity.sourcecontactidlocal);
          let targetContactids = JSON.parse(activity.targetcontactidslocal);
          let assigneeContactids = JSON.parse(activity.assigneecontactidslocal);

          this.uniqueContacts = this.uniqueContacts.concat(targetContactids);
          this.uniqueContacts = this.uniqueContacts.concat(assigneeContactids);
        }

        this.activities[i].targetcontactidslocal = JSON.parse(activity.targetcontactidslocal);
        this.activities[i].assigneecontactidslocal = JSON.parse(activity.assigneecontactidslocal);

      }

      if (this.activitiesFindCount == 0) {
        this.uniqueContacts = Array.from(new Set(this.uniqueContacts));
        this.databaseProvider.getSyncInfo().then((data) => {
          let syncinfo = data["info"];

          this.databaseProvider.findContacts(this.uniqueContacts.join(), true).then((contacts) => {

            let totalContacts = contacts["length"];
            this.contactsMap = {};

            for (let i = 0; i < totalContacts; i++) {
              this.contactsMap[contacts[i].localid] = contacts[i];
            }

            let loggedInContact = new Contact();
            loggedInContact.firstname = syncinfo["contactname"];
            loggedInContact.lastname = "";
            loggedInContact.id = syncinfo["contactid"];
            loggedInContact.localid = -1;

            this.contactsMap[-1] = loggedInContact;
          });

        });
      }

      this.activitiesFindCount++;
      this.countValidActivities();
    });
  }

  countValidActivities() {
    this.validActivities = 0;
    for (let activity of this.activities) {
      if (this.currentActivitiesFilter == 0 || this.currentActivitiesFilter == activity.activitytypeid) {
        this.validActivities++;
      }
    }

    if (this.currentActivitiesFilter != 0) {
      this.noActivitiesLabel = this.activityTypesMap[this.currentActivitiesFilter]["label"] + " activities not found";
    } else {
      this.noActivitiesLabel = "Activities not found";
    }
  }

  openFilterDialog() {
    let alert = this.alertsController.create();
    alert.setTitle('Filter Activities');

    alert.addInput({
      type: 'radio',
      label: 'All',
      value: '0',
      checked: (this.currentActivitiesFilter == 0) ? true : false,
    });

    for (let activityType of this.activityTypes) {
      alert.addInput({
        type: 'radio',
        label: activityType["label"],
        value: activityType["value"],
        checked: (this.currentActivitiesFilter == activityType["value"]) ? true : false,
      });
    }

    alert.addButton('Cancel');
    alert.addButton({
      text: 'Ok',
      handler: (data: any) => {
        this.currentActivitiesFilter = data;
        this.countValidActivities();
      }
    });

    alert.present();
  }

  openSortDialog() {
    let alert = this.alertsController.create();
    alert.setTitle('Sort Activities');

    alert.addInput({
      type: 'radio',
      label: 'Newest First',
      value: '1',
      checked: (this.currentActivitiesSort == 1) ? true : false,
    });

    alert.addInput({
      type: 'radio',
      label: 'Oldest First',
      value: '0',
      checked: (this.currentActivitiesSort == 0) ? true : false,
    });


    alert.addButton('Cancel');
    alert.addButton({
      text: 'Ok',
      handler: (data: any) => {
        if (data != this.currentActivitiesSort) {
          this.findActivities((data == '1') ? true : false);
        }
        this.currentActivitiesSort = data;
      }
    });

    alert.present();
  }

  /**
   * Used by front end
   * @param date string date
   */
  convertDateObject(date) {
    let obj = new Date(date);
    if (obj.toString() !== 'Invalid Date') {
      return obj;
    }
    // in case of the string cannot be parse, try second way
    let arr = date.split(/[- :]/);
    obj = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
    return obj;
  }
}
