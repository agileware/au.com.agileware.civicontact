import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ContactsProvider } from "../../providers/contacts/contacts";
import { UtilsProvider } from "../../providers/utils/utils";
import { LoadingProvider } from "../../providers/loading/loading";
import { Events } from "ionic-angular";

/**
 * Generated class for the GroupContactsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-group-contacts',
  templateUrl: 'group-contacts.html',
})
export class GroupContactsPage {

  private group;
  private pagetitle = "Group Contacts";

  public directorykeys = [];
  public directoryvalues = [];
  public pagenumber = 0;

  public defaultdirectory = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, public contactsProvider: ContactsProvider,
    public utilsProvider: UtilsProvider, public loadingProvider: LoadingProvider, public events: Events) {
    this.directorykeys = [];
    this.directoryvalues = [];
  }

  ionViewDidLoad() {

    this.utilsProvider.trackPageOpen("GroupContacts");

    this.group = this.navParams.get('group');
    this.pagetitle = this.group.name + " Contacts";

    this.fetchContactsFromStorage(false);

    this.contactsProvider.getGroupContacts(this.group.id).then((data) => {

    });

    this.events.subscribe("contact:deleted", (data) => {
      let contactid = data["contactid"];
      this.utilsProvider.modifyKeysAndValues(contactid, this.directorykeys, this.directoryvalues);
    });

  }

  fetchContactsFromStorage(isFromPaging, event = null) {
    this.contactsProvider.getDirectory(this.pagenumber, this.group.id).then(data => {
      let directory = data["directory"];
      if (Object.keys(directory).length == 0) {
        if (event != null) {
          event.enable(false);
        }
        this.loadingProvider.dismissAlert();
        return;
      }

      directory = this.mergeIntoExistingDirectory(directory);
      this.showDirectory(directory);
      if (!isFromPaging) {
        this.loadingProvider.dismissAlert();
      } else {
        event.complete();
      }
    });
  }

  showDirectory(directory) {
    this.directorykeys = Object.keys(directory);
    this.directorykeys.sort();

    for (let key of this.directorykeys) {
      this.directoryvalues[key] = directory[key];
    }
  }

  mergeIntoExistingDirectory(directory) {
    let keys = Object.keys(directory);
    for (let key of keys) {
      if (typeof this.defaultdirectory[key] !== "undefined") {
        this.defaultdirectory[key] = this.defaultdirectory[key].concat(directory[key]);
      } else {
        this.defaultdirectory[key] = directory[key];
      }
    }
    return this.defaultdirectory;
  }

  openContact(contact) {
    this.contactsProvider.openContactPage(contact, this.navCtrl);
  }

}
