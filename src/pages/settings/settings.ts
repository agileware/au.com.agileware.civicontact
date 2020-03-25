import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { ActionSheet, ActionSheetOptions } from '@ionic-native/action-sheet';
import { DatabaseProvider } from '../../providers/database/database';
import { LoadingProvider } from '../../providers/loading/loading';
import { SyncProvider } from '../../providers/sync/sync';
import { WelcomePage } from '../../pages/welcome/welcome';
import { AlertController, Events } from 'ionic-angular';
import { AccountsPage } from '../../pages/accounts/accounts';
import { UtilsProvider } from '../../providers/utils/utils';
import { MoreInformationPage } from '../more-information/more-information';
import { SettingsProvider } from '../../providers/settings/settings';

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  private syncinterval: string = "Every hour";
  private accountname: string = "";
  private syncinfo;
  private emailtoactivity: boolean = false;
  private syncdatetime: string = "";
  private useglobalconfig: boolean = false;

  private buttonLabels = ['15 minutes', '30 minutes', 'Every hour', 'Every 4 hours', 'Daily', 'Never'];
  private buttonValues = ['900', '1800', '3600', '14400', '86400', 'never'];

  constructor(public navCtrl: NavController, public navParams: NavParams, private actionSheet: ActionSheet,
    public databaseProvider: DatabaseProvider, private loadingProvidder: LoadingProvider,
    public syncProvider: SyncProvider, public alertsController: AlertController,
    public events: Events, public utilsProvider: UtilsProvider, private platform: Platform, private settingsProvider: SettingsProvider) {


    this.platform.registerBackButtonAction(function (event) {
      console.log("Back button clicked");
      navCtrl.pop();
    });
  }

  ionViewDidLoad() {
    this.refreshSyncInfo();
    this.utilsProvider.trackPageOpen("Settings");

    this.events.subscribe("sync:globalinfo:updated", (data) => {
      if (data["status"]) {
        this.refreshSyncInfo();
      }
    });
  }

  refreshSyncInfo() {
    this.databaseProvider.getSyncInfo().then((data) => {
      let info = data["info"];
      this.syncinfo = info;
      if (info["useglobalconfig"] == "1") {
        this.useglobalconfig = true;
      } else {
        this.useglobalconfig = false;
      }
      let interval = this.syncinfo["syncinterval"];
      let buttonLabelIndex = this.buttonValues.indexOf(interval);
      if (buttonLabelIndex >= 0) {
        this.syncinterval = this.buttonLabels[buttonLabelIndex];
      }
      this.accountname = this.syncinfo["contactname"];
      if (this.syncinfo["emailtoactivity"] == 1) {
        this.emailtoactivity = true;
      } else {
        this.emailtoactivity = false;
      }
      this.syncdatetime = this.syncinfo["lastpulldatetime"];
    });
  }

  changeEmailToActivity() {
    this.databaseProvider.updateEmailToActivity(this.emailtoactivity);
  }

  syncNow() {
    this.loadingProvidder.showAlert("Syncing, Please wait...");
    this.syncProvider.sync(true).then((data) => {
      this.loadingProvidder.dismissAlert();
      if (data["status"]) {
        this.refreshSyncInfo();
        this.utilsProvider.trackEvent("Sync", "Force", "Forced Sync.", 1, true);
        this.events.publish("sync:force", {
          "status": true
        });
      } else {
        this.utilsProvider.showAlert("Sync Failed", data["message"]);
      }
    });
  }

  changeaccounts() {
    this.navCtrl.push(AccountsPage, {});
  }

  logout() {
    let alert = this.alertsController.create({
      title: 'Log Out',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            this.databaseProvider.deleteSyncData().then((data) => {
              this.databaseProvider.deleteActiveAccount().then((data) => {
                if (data["status"]) {
                  this.databaseProvider.activateLastAccount().then((data) => {
                    this.utilsProvider.trackEvent("App", "Logout", "Logout from Application", 0, true);
                    this.navCtrl.setRoot(WelcomePage, {
                      'fromlogout': true
                    });
                  });
                } else {
                  this.utilsProvider.showAlert("Log Out", "Error occured while deleting the account, Please try again.")
                }
              });
            });
          }
        }
      ]
    });
    alert.present();
  }

  openSyncIntervalOptions() {

    const options: ActionSheetOptions = {
      title: 'Sync interval',
      buttonLabels: this.buttonLabels,
      addCancelButtonWithLabel: 'Cancel',
      // androidTheme: this.actionSheet.ANDROID_THEMES.THEME_HOLO_DARK,
    };

    this.actionSheet.show(options).then((buttonIndex: number) => {
      if (buttonIndex <= this.buttonLabels.length && buttonIndex > 0) {
        this.syncinterval = this.buttonLabels[buttonIndex - 1];
        this.updateSyncInterval(this.buttonValues[buttonIndex - 1]);
      }
    });
  }

  updateSyncInterval(value) {
    this.utilsProvider.trackEvent("Sync", "Interval Update", "Updating sync interval settings.", 1, true);
    this.databaseProvider.updateSyncInterval(value);
  }

  moreinformation() {
    this.navCtrl.push(MoreInformationPage, {});
  }

}
