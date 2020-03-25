import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DatabaseProvider } from "../../providers/database/database";
import { DatePicker } from "@ionic-native/date-picker";
import { Activity } from "../../models/activity";
import { UtilsProvider } from "../../providers/utils/utils";
import { LoadingProvider } from "../../providers/loading/loading";

/**
 * Generated class for the NewActivityPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-new-activity',
  templateUrl: 'new-activity.html',
})
export class NewActivityPage {

  private contact: any = null;
  private addActivityFormGroup: FormGroup;
  private activityTypes: any = [];
  private datetimeFormat: string = "YYYY-MM-DD HH:mm";
  private activity: Activity = null;
  private syninfo: any = null;

  constructor(public navCtrl: NavController, public navParams: NavParams, public formsBuilder: FormBuilder, private databaseProvider: DatabaseProvider
    , public datePicker: DatePicker, private loadingProvider: LoadingProvider, private utilsProvider: UtilsProvider) {
    this.contact = navParams.get('contact');
    this.addActivityFormGroup = formsBuilder.group({
      'activitytype': ['', Validators.required],
      'activitydate': ['', Validators.required],
      'activitysubject': [''],
      'activitycomments': [''],
    });
    this.activity = new Activity();
    this.databaseProvider.getSyncInfo().then((data) => {
      this.syninfo = data["info"];
    });

    // Default datetime is current time
    let now = new Date();
    now.setSeconds(0);
    this.activity.activitydatetime = now.toISOString();
  }

  ionViewDidLoad() {
    this.utilsProvider.trackPageOpen("New Activity");
    this.databaseProvider.findAllActivityTypes().then((activitytypes) => {
      this.activityTypes = activitytypes;
    });
  }

  submitAddActivityForm() {

    this.loadingProvider.showAlert("Adding activity, Please wait...");

    // reformat date
    this.activity.activitydatetime = this.databaseProvider.getDateInFormat(new Date(this.activity.activitydatetime));

    this.activity.sourcecontactid = this.syninfo["contactid"];
    this.activity.assigneecontactids = this.syninfo["contactid"];
    this.activity.targetcontactids = this.contact.id;

    this.activity.sourcecontactidlocal = "" + UtilsProvider.LOGGEDIN_USERID_LOCALID;
    this.activity.assigneecontactidslocal = JSON.stringify([UtilsProvider.LOGGEDIN_USERID_LOCALID]);
    this.activity.targetcontactidslocal = JSON.stringify([this.contact.localid]);

    this.databaseProvider.insertActivity(this.activity, true).then((data) => {
      this.loadingProvider.dismissAlert();
      if (data["status"]) {
        this.utilsProvider.showToast("Activity has been added.");
        this.utilsProvider.trackEvent("Activity", "Added", "New activity added.", data["activity"].localid, true);
        this.navCtrl.pop();
      }
    });
  }
}
