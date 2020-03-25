import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { SettingsPage } from '../settings/settings';
import { ViewController } from 'ionic-angular/navigation/view-controller';

/**
 * Generated class for the DashboardMoreOptionsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-dashboard-more-options',
  templateUrl: 'dashboard-more-options.html',
})
export class DashboardMoreOptionsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private viewCtrl: ViewController) {
  }

  ionViewDidLoad() {

  }


  openSettings() {
    this.navCtrl.push(SettingsPage, {}, {}, () => {

    });
  }
}
