import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, AlertController, MenuController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { DatabaseProvider } from '../providers/database/database';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { AppVersion } from '@ionic-native/app-version';

import { WelcomePage } from '../pages/welcome/welcome'
import { SyncProvider } from '../providers/sync/sync';
import { Events } from 'ionic-angular';
import { UtilsProvider } from "../providers/utils/utils";
import { Deeplinks } from "@ionic-native/deeplinks";
import { LoadingProvider } from '../providers/loading/loading';
import { AccountsPage } from '../pages/accounts/accounts';
import { ActionSheetOptions, ActionSheet } from '@ionic-native/action-sheet';
import { MoreInformationPage } from '../pages/more-information/more-information';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = WelcomePage;
  private syncinterval: string = "Every hour";
  private accountname: string = "";
  private syncinfo;
  private emailtoactivity: boolean = false;
  private syncdatetime: string = "";
  private useglobalconfig: boolean = false;

  private buttonLabels = ['15 minutes', '30 minutes', 'Every hour', 'Every 4 hours', 'Daily', 'Never'];
  private buttonValues = ['900', '1800', '3600', '14400', '86400', 'never'];

  @ViewChild(Nav) navChild: Nav;

  constructor(private platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private databaseProvider: DatabaseProvider,
    public syncProvider: SyncProvider, private events: Events, public googleAnalytics: GoogleAnalytics,
    public appVersion: AppVersion, private utilsProvider: UtilsProvider, private deeplinks: Deeplinks,
    private loadingProvidder: LoadingProvider, private menuCtrl: MenuController,
    private alertsController: AlertController, private actionSheet: ActionSheet) {


    platform.ready().then(() => {
      statusBar.styleDefault();
      statusBar.overlaysWebView(false);
      splashScreen.hide();
      databaseProvider.openOrCreateMasterDB();
    });

    // update the GA tracker id
    this.events.subscribe("ga:update", (data) => {
      // CCA-362 setting undefined will casue iOS crash
      if (typeof data['GAID'] === 'string') {
        this.googleAnalytics.startTrackerWithId(data['GAID'])
        .then((result) => this.appVersion.getVersionNumber())
        .then((versionnumber) => this.googleAnalytics.setAppVersion(versionnumber));
      }
    });

    this.events.subscribe("database:ready", (data) => {
      if (data["status"]) {
        this.setIntervalSync(syncProvider);
      }
    });

    // Deeplinks
    this.platform.ready().then(() => {
      this.deeplinks.route({
        '/login': WelcomePage
      }).subscribe(match => {
        this.navChild.push(match.$route, match);
        // console.log('Successfully matched route', match);
      }, nomatch => {
        console.error('Got a deeplink that didn\'t match', nomatch);
        window.open(nomatch.$link);
      });
    });

    // Menu
    this.events.subscribe("database:ready", (data) => {
      if (data["status"]) {
        this.refreshSyncInfo();
      }
    });
  }

  setIntervalSync(syncProvider) {
    this.databaseProvider.getSyncInfo().then((data) => {
      if (data["status"]) {
        let syncinfo = data["info"];
        if (syncinfo["syncinterval"] != 'never') {
          window.setInterval(function () {
            syncProvider.sync();
          }, parseInt(syncinfo["syncinterval"]) * 1000);
        }
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
    this.menuCtrl.close();
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
    this.menuCtrl.close();
    this.navChild.push(AccountsPage, {});
  }

  logout() {
    this.menuCtrl.close();
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
                    this.navChild.setRoot(WelcomePage, {
                      'fromlogout': true
                    });
                  });
                } else {
                  this.utilsProvider.showAlert("Log Out", "Error occurred while deleting the account, please try again.")
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
    this.menuCtrl.close();
    this.navChild.push(MoreInformationPage, {});
  }

}
