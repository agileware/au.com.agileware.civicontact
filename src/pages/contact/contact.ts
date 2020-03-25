import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { UtilsProvider } from '../../providers/utils/utils';
import { DatabaseProvider } from '../../providers/database/database';
import { PopoverController } from 'ionic-angular';
import { ContactMoreOptionsPage } from '../contact-more-options/contact-more-options';
import { AddContactPage } from '../../pages/add-contact/add-contact';
import { LoadingProvider } from '../../providers/loading/loading';
import { Events } from "ionic-angular";
import { ActivitiesPage } from "../activities/activities";
import { NewActivityPage } from "../new-activity/new-activity";
import { EditHistoryPage } from "../edit-history/edit-history";
import { ContactSummaryPage } from "../contact-summary/contact-summary";


/**
 * Generated class for the ContactPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html',
})
export class ContactPage {

  public contact;
  public syncinfo;
  public profilefields;
  public profilefieldlabels;

  constructor(public navCtrl: NavController, public navParams: NavParams, public utilsProvider: UtilsProvider, public databaseProvider: DatabaseProvider,
    public popoverController: PopoverController, public loadingProvider: LoadingProvider, public events: Events) {
    this.contact = this.navParams.get("contact");
    console.log(this.contact);
    this.profilefields = [];
    this.databaseProvider.getSyncInfo().then((data) => {
      this.syncinfo = data["info"];
      let profilefields = JSON.parse(this.syncinfo["ccaprofilefields"]);
      this.setProfileFieldValuesWithData(profilefields, null);
      this.profilefields = profilefields;
    });
  }

  ionViewDidLoad() {
    this.utilsProvider.trackPageOpen("Contact Details");
    this.events.subscribe("contact:updated", (data) => {
      this.databaseProvider.findContact(this.contact.localid, true).then((contact) => {
        this.contact = contact;
      });
    });
    this.findProfileFieldsData();
  }

  findProfileFieldsData() {
    let findbylocal = (this.contact.id) ? false : true;
    let contactid = (this.contact.id) ? this.contact.id : this.contact.localid;

    this.databaseProvider.findProfileFieldsDataByContact(contactid, findbylocal, true).then((data) => {
      this.setProfileFieldValuesWithData(this.profilefields, data);
    });
  }

  setProfileFieldValuesWithData(profilefields, data) {
    this.profilefieldlabels = {};

    for (let profilefield of profilefields) {
      let fieldlabel: any = "";
      if (data != null && typeof data[profilefield["name"]] !== "undefined") {
        fieldlabel = data[profilefield["name"]]["label"];
        if (profilefield["html_type"] == "CheckBox" || profilefield["html_type"] == "Multi-Select Country" || profilefield["html_type"] == "Multi-Select State/Province" || profilefield["html_type"] == "Multi-Select") {
          fieldlabel = fieldlabel.replace(",", ", ");
        }
      }

      if (fieldlabel == "") {
        fieldlabel = "-";
      }
      this.profilefieldlabels[profilefield["name"]] = fieldlabel;
    }
  }

  openMoreMenu(event) {
    let popover = this.popoverController.create(ContactMoreOptionsPage, {
      'contact': this.contact
    });
    popover.present({
      ev: event
    });
    popover.onDidDismiss((data) => {
      if (data != null && data["status"] && data["opfor"] == "openactivities") {
        this.navCtrl.push(ActivitiesPage, {
          'contact': this.contact,
        });
      } else if (data != null && data["status"] && data["opfor"] == "opensummary") {
        this.navCtrl.push(ContactSummaryPage, {
          'contact': this.contact,
          'profilefieldslabel': this.profilefieldlabels,
          'profilefields': this.profilefields,
        });
      } else if (data != null && data["status"] && data["opfor"] == "newactivity") {
        this.navCtrl.push(NewActivityPage, {
          'contact': this.contact,
        });
      } else if (data != null && data["status"] && data["opfor"] == "delete") {
        this.utilsProvider.trackEvent("Contact", "Deleted", "Deleted contact.", 0, true);
        this.utilsProvider.showToast("Contact has been deleted successfully.");
        this.navCtrl.pop();
      }
    });
  }

  emailContact(emailaddress) {
    if (this.syncinfo["emailtoactivity"] == 1) {
      this.databaseProvider.getCiviEmails().then((emails) => {
        let bccemail = null;
        if (emails["length"] > 0) {
          bccemail = emails[0];
        }
        this.utilsProvider.email(this.contact, emailaddress, bccemail);
      });
    } else {
      this.utilsProvider.email(this.contact, emailaddress);
    }
  }

  callContact(phonenumber) {
    this.utilsProvider.call(this.contact, phonenumber).then((data) => {
      if (data["status"]) {
        this.databaseProvider.recordCallHistory(this.contact, phonenumber).then((data) => {
          this.navCtrl.push(EditHistoryPage, {
            'callhistory': data["history"],
          });
        });
      }
    });
  }

  textContact(phonenumber) {
    this.utilsProvider.text(this.contact, phonenumber);
  }

  unFavourite(contact) {
    this.loadingProvider.showAlert("Please wait...");

    contact.isfavourite = 0;
    this.databaseProvider.updateContact(contact).then((data) => {
      this.databaseProvider.unFavouriteContact(contact.localid, true).then((data) => {
        this.loadingProvider.dismissAlert();
        if (data["status"]) {
          this.utilsProvider.trackEvent("Contact", "Unfavourited", "Unfavourited contact.", 0, true);
          contact.isfavourite = 0;
        }
      });
    });
  }

  favourite(contact) {
    this.loadingProvider.showAlert("Please wait...");
    contact.isfavourite = 1;
    this.databaseProvider.updateContact(contact, true).then((data) => {
      this.databaseProvider.insertOrUpdateFavouriteContact(this.contact).then((data) => {
        this.utilsProvider.trackEvent("Contact", "Favourited", "Favourited contact.", 0, true);
        this.loadingProvider.dismissAlert();
      });
    });
  }

  editContact(contact) {
    this.navCtrl.push(AddContactPage, {
      'contact': contact
    });
  }

}
