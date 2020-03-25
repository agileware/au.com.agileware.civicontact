import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AppVersion } from '@ionic-native/app-version';
import { UtilsProvider } from "../../providers/utils/utils";

/**
 * Generated class for the MoreInformationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-more-information',
  templateUrl: 'more-information.html',
})
export class MoreInformationPage {

  private appversion = "";

  constructor(public navCtrl: NavController, public navParams: NavParams, private appVersionProvider: AppVersion, public utilsProvider: UtilsProvider) {
    this.appVersionProvider.getVersionNumber().then((versionnumber) => {
      this.appversion = versionnumber;
    });
  }

  ionViewDidLoad() {
    this.utilsProvider.trackPageOpen("More Information");
  }

}
