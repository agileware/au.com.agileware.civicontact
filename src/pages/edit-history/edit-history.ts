import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { CallHistory } from "../../models/callhistory";
import { DatabaseProvider } from "../../providers/database/database";
import { UtilsProvider } from "../../providers/utils/utils";

/**
 * Generated class for the EditHistoryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-edit-history',
  templateUrl: 'edit-history.html',
})
export class EditHistoryPage {

  private callhistory: CallHistory;

  constructor(public navCtrl: NavController, public navParams: NavParams, private databaseProvider: DatabaseProvider, private utilsProvider: UtilsProvider) {
    this.callhistory = this.navParams.get('callhistory');
  }

  ionViewDidLoad() {
    this.utilsProvider.trackPageOpen("Edit CallHistory");
  }

  saveCallHistory() {
    if (this.callhistory.duration != 0 || this.callhistory.details.trim() != '') {
      console.log(this.callhistory);
      this.databaseProvider.updateCallHistory(this.callhistory, true, true).then((data) => {
        this.utilsProvider.showToast("Call details has been recorded.");
        this.utilsProvider.trackEvent("CallHistory", "updated", "Call history updated: Call details has been recorded.", this.callhistory.id, true);
        this.navCtrl.pop();
      });
    } else {
      this.navCtrl.pop();
    }
  }

}
