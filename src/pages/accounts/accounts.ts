import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { WelcomePage } from '../../pages/welcome/welcome';
import { UtilsProvider } from '../../providers/utils/utils';
import { LoadingProvider } from '../../providers/loading/loading';

/**
 * Generated class for the AccountsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-accounts',
  templateUrl: 'accounts.html',
})
export class AccountsPage {

  public accounts = [];
  public activeaccount = null;

  constructor(public navCtrl: NavController, public navParams: NavParams, public databaseProvider: DatabaseProvider,
    public utilsProvider: UtilsProvider, public loadingProvider: LoadingProvider) {
  }

  ionViewDidLoad() {

    this.utilsProvider.trackPageOpen("Accounts");

    this.databaseProvider.getAccounts().then((accounts) => {
      this.accounts = <Array<any>>accounts;
    });

    this.databaseProvider.getActiveAccount().then((account) => {
      this.activeaccount = account;
    });
  }

  addNewAccount() {
    this.navCtrl.push(WelcomePage, {
      'fromaddaccount': true
    });
  }

  switchAccount(account) {
    if (this.activeaccount.contact_id == account.contact_id && this.activeaccount.rest_end_point == account.rest_end_point) {
      this.utilsProvider.showAlert("Switch Account", "This account is already in use.");
    } else {
      this.loadingProvider.showAlert("Switching account, Please wait...");
      this.databaseProvider.makeOtherAccountsInActive(account).then((data) => {
        if (data["status"]) {
          this.databaseProvider.makeAccountActive(account).then(() => {
            this.loadingProvider.dismissAlert();
            if (data["status"]) {
              this.utilsProvider.trackEvent("Accounts", "Switch", "Swittched to another account.", 1, true);
              this.navCtrl.push(WelcomePage, {
                'switchaccount': true,
                'account': account,
              });
            }
          });
        } else {
          this.loadingProvider.dismissAlert();
        }
      });
    }
  }

}
