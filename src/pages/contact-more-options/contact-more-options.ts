import { Component } from '@angular/core';
import { ViewController, NavParams, NavController } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { AlertController } from 'ionic-angular';
import { LoadingProvider } from '../../providers/loading/loading';

/**
 * Generated class for the ContactMoreOptionsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-contact-more-options',
  templateUrl: 'contact-more-options.html',
})
export class ContactMoreOptionsPage {

  public contact;

  constructor(public viewCtrl: ViewController, public navCtrl: NavController, public navParams: NavParams, public databaseProvider: DatabaseProvider,
    public alertsController: AlertController, public loadingProvider: LoadingProvider) {
    this.contact = navParams.get("contact");
  }

  ionViewDidLoad() {

  }

  close(data) {
    this.loadingProvider.dismissAlert();
    this.viewCtrl.dismiss(data);
  }

  newactivity() {
    let data = {};
    data["opfor"] = "newactivity";
    data["status"] = true;
    this.close(data);
  }

  activities() {
    let data = {};
    data["opfor"] = "openactivities";
    data["status"] = true;
    this.close(data);
  }

  contactsummary() {
    let data = {};
    data["opfor"] = "opensummary";
    data["status"] = true;
    this.close(data);
  }

  deleteContact() {

    let alert = this.alertsController.create({
      title: 'Confirm delete',
      message: 'This contact will be deleted.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {

          }
        },
        {
          text: 'OK',
          handler: () => {

            this.loadingProvider.showAlert("Deleting contact, Please wait...");

            this.databaseProvider.deleteContact(this.contact).then((data) => {
              if (data["status"]) {
                data["opfor"] = "delete";
                this.close(data);
              }
            });
          }
        }
      ]
    });
    alert.present();
  }

}
