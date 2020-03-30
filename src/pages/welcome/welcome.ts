import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { UtilsProvider } from '../../providers/utils/utils';
import { DatabaseProvider } from '../../providers/database/database';
import { LoadingProvider } from '../../providers/loading/loading';
import { SyncProvider } from '../../providers/sync/sync';
import { HomePage } from '../home/home';
import { Events } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import { GoogleAnalytics } from '@ionic-native/google-analytics';

/**
 * Generated class for the WelcomePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {

  public showScanButton: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, private qrScanner: QRScanner,
    public utilsProvider: UtilsProvider, public databaseProvider: DatabaseProvider, public loadingProvider: LoadingProvider,
    public syncProvider: SyncProvider, public events: Events, public http: HttpClient, public googleAnalytics: GoogleAnalytics) {
    let link: any = this.navParams.data.$link;
    // Login from url
    if (typeof link != 'undefined') {
      this.databaseProvider.hasLogin().then((data) => {
        if (data["login"]) {
          this.utilsProvider.showToast('You have already logged in.');
          this.openHomePage();
        } else {
          let url = link.queryString.match(/auth=(.*)&?/);
          if (url === null) {
            this.utilsProvider.showAlert('Error', 'Invalid URL.');
            this.showScanButton = true;
            return;
          }
          url = decodeURIComponent(url[1]);
          this.authWithLink(decodeURI(url));
        }
      });
    }
  }

  ionViewDidLoad() {

    this.events.subscribe("masterdatabase:ready", (data) => {
      if (data["status"]) {
        this.loginActiveAccountIfAny();
      }
    });

    this.events.subscribe("database:ready", (data) => {
      if (data["status"]) {
        this.getSyncInfo();
      }
    });

    if (this.navParams.get('fromlogout')) {
      this.loginActiveAccountIfAny();
    }

    if (this.navParams.get('fromaddaccount')) {
      this.showScanButton = true;
    }

    if (this.navParams.get('switchaccount')) {
      let account = this.navParams.get('account');
      this.databaseProvider.openOrCreateDB(account["contact_id"]);
    }
  }

  loginActiveAccountIfAny() {
    this.databaseProvider.getActiveAccount().then((account) => {
      if (account == null) {
        this.showScanButton = true;
        this.utilsProvider.trackPageOpen("Welcome");
      } else {
        console.log("Loggin in.. " + account["contact_id"]);
        this.databaseProvider.openOrCreateDB(account["contact_id"]);
      }
    });
  }

  getSyncInfo() {
    this.databaseProvider.getSyncInfo().then((data) => {
      if (data["status"]) {
        // add a login event for the GA to update its id
        this.events.publish("ga:update", {
          "GAID": data['info']['google_analytics_id']
        });
        this.googleAnalytics.setUserId(data["info"]["contactid"]).then((data) => {

        });
        this.openHomePage();
      }
    });
  }

  scanQRCode() {
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          let scanSub = this.qrScanner.scan().subscribe((jsonstring: string) => {
            this.qrScanner.destroy();
            window.document.querySelector('ion-app').classList.remove('transparent-body');
            scanSub.unsubscribe();
            this.authWithQRCode(jsonstring);
          });
          this.qrScanner.show();
          window.document.querySelector('ion-app').classList.add('transparent-body');
        } else if (status.denied) {
          this.openPermissionsAlert();
        } else {
          this.openPermissionsAlert();
        }
      });
  }

  openPermissionsAlert() {
    this.utilsProvider.showAlert("Permission Required", "CiviContact requires permission to access camera for scanning QR code.");
  }

  /**
   * Authenticate with URL
   * @param url string the url for authentication
   */
  authWithLink(url) {
    console.log(url);
    this.showScanButton = false;

    this.http.get(url).subscribe(
      data => {
        this.loadingProvider.showAlert("Setting up CiviContact, Please wait...");
        if (data['error'] == 0) {
          console.log('data: ', data);
          this.setupApplication(data);
        } else {
          this.utilsProvider.showAlert("Login Unsuccessful", "Looks like you have a invalid link. Please re-generate a authentication link.");
          this.loadingProvider.dismissAlert();
          this.showScanButton = true;
        }
      },
      error => {
        this.utilsProvider.showAlert("Login Unsuccessful", "Looks like you have a invalid link. Please re-generate a authentication link.");
        this.loadingProvider.dismissAlert();
        this.showScanButton = true;
      });
  }

  /**
   * Authenticate using QR code
   * @param json object the payload of QR code
   */
  authWithQRCode(json) {
    this.showScanButton = false;
    json = JSON.parse(json);

    this.http.get(json['auth_url']).subscribe(data => {
      this.loadingProvider.showAlert("Setting up CiviContact, Please wait...");
      if (data['error'] == 0) {
        console.log('data: ', data);
        this.setupApplication(data);
      } else {
        this.utilsProvider.showAlert("Login Unsuccessful", "Looks like you have a invalid QR code. Please re-generate a QR code.");
        this.loadingProvider.dismissAlert();
        this.showScanButton = true;
      }
    });
  }

  setupApplication(json) {
    json = this.modifyEndPoint(json);
    if (!("groupid" in json) || json["groupid"] == 0) {
      this.utilsProvider.showAlert("Login Unsuccessful", "Looks like the default App contacts group has been deleted, which is required to login. Ask your CiviCRM administrator to reinstall the extension.");
      this.loadingProvider.dismissAlert();
      this.showScanButton = true;
      return;
    }

    this.databaseProvider.findAccount(json).then((account) => {
      if (account != null) {
        this.loadingProvider.dismissAlert();
        this.showScanButton = true;
        this.utilsProvider.showAlert("Application setup", "This account is already added.");
      } else {
        this.databaseProvider.addAccount(json).then((accountdata) => {
          if (accountdata["status"]) {

            this.databaseProvider.makeOtherAccountsInActive(json);

            this.databaseProvider.openOrCreateDB(json.contact_id).then((data) => {
              if (!data["status"]) {
                this.showScanButton = true;
                this.loadingProvider.dismissAlert();
                this.databaseProvider.deleteAccount(accountdata['result']['insertId']).then(deleteResult => {
                  this.utilsProvider.showAlert("Application setup", "An error occurred while creating database, Please try again.");
                  this.showScanButton = true;
                });
              } else {
                this.databaseProvider.deleteSyncData().then((data) => {
                  if (data["status"]) {
                    this.databaseProvider.insertSyncData(json).then((data) => {
                      if (data["status"]) {
                        console.log("Starting sync pull...");
                        this.syncProvider.pull(true).then((pulldata) => {
                          this.loadingProvider.dismissAlert();
                          if (pulldata["status"]) {
                            this.utilsProvider.trackEvent("App", "Login", "Login into Application", 1, true);
                            // add a login event for the GA to update its id
                            this.events.publish("ga:update", {
                              "GAID": data['cca_client_google_analytics']
                            });
                            window.location.reload();
                          } else {
                            this.databaseProvider.deleteSyncData();
                            this.databaseProvider.deleteAccount(accountdata['result']['insertId']).then(deleteResult => {
                              this.utilsProvider.showAlert("Login Unsuccessful", pulldata["message"]);
                              this.showScanButton = true;
                            });
                          }
                        });
                      } else {
                        this.databaseProvider.deleteAccount(accountdata['result']['insertId']).then(deleteResult => {
                          this.showApplicationSetupError();
                          this.showScanButton = true;
                        });
                      }
                    });
                  } else {
                    this.databaseProvider.deleteAccount(accountdata['result']['insertId']).then(deleteResult => {
                      this.showApplicationSetupError();
                      this.showScanButton = true;
                    });
                  }
                });
              }
            });
          } else {
            this.databaseProvider.deleteAccount(accountdata['result']['insertId']).then(deleteResult => {
              this.showApplicationSetupError();
              this.showScanButton = true;
            });
          }
        });
      }
    });
  }


  openHomePage() {
    this.navCtrl.setRoot(HomePage, {
      'fromwelcome': true
    });
  }

  showApplicationSetupError() {
    this.showScanButton = true;
    this.loadingProvider.dismissAlert();
    this.utilsProvider.showAlert("Application setup", "An error occurred while setting up your application, Please try again.");
  }

  modifyEndPoint(data) {
    data.rest_end_point = data.rest_end_point.replace("localhost", "192.168.88.185");
    return data;
  }

}
