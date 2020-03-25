import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { UtilsProvider } from "../../providers/utils/utils";

/**
 * Generated class for the ContactSummaryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-contact-summary',
  templateUrl: 'contact-summary.html',
})
export class ContactSummaryPage {

  private profilefieldslabel;
  private profilefields;
  private contact;

  constructor(public navCtrl: NavController, public navParams: NavParams, public utilsProvider: UtilsProvider) {
    this.contact = this.navParams.get('contact');
    this.profilefields = this.navParams.get('profilefields');
    this.profilefieldslabel = this.navParams.get('profilefieldslabel');
  }

  ionViewDidLoad() {
    this.utilsProvider.trackPageOpen("Contact Summary");
  }

}
