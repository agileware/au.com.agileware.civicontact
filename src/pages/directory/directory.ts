import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ContactsProvider } from '../../providers/contacts/contacts';
import { Events } from 'ionic-angular';
import { LoadingProvider } from '../../providers/loading/loading';
import { AddContactPage } from '../../pages/add-contact/add-contact';
import { UtilsProvider } from "../../providers/utils/utils";

/**
 * Generated class for the DirectoryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-directory',
  templateUrl: 'directory.html',
})
export class DirectoryPage {

  public directorykeys = [];
  public directoryvalues = [];
  public isSearching = false;
  public defaultdirectory = [];
  public pagenumber = 0;

  constructor(public navCtrl: NavController, public navParams: NavParams, public contactsprovider: ContactsProvider,
    public events: Events, public loadingProvidder: LoadingProvider, public utilsProvider: UtilsProvider) {
    this.directorykeys = [];
    this.directoryvalues = [];
  }

  ionViewDidEnter() {

  }

  ionViewWillLeave() {
    if (this.isSearching) {
      this.events.publish("search:forcestop", {
        "from": "directory"
      });
      this.isSearching = false;
      this.showDirectory(this.defaultdirectory);
    }
  }

  ionViewDidLoad() {

    this.utilsProvider.trackPageOpen("Directory");

    this.events.subscribe("search:started", (data) => {
      if (data["tabindex"] == 2) {
        let directory = data["contacts"];
        this.showDirectory(directory);
        this.isSearching = true;
      }
    });

    this.events.subscribe("search:stopped", (data) => {
      if (data["tabindex"] == 2) {
        this.isSearching = false;
        this.showDirectory(this.defaultdirectory);
      }
    });

    this.events.subscribe("sync:force", (data) => {
      console.log("Sync forced...");
      this.pagenumber = 0;
      this.resetDirectoryValues();
      this.fetchContactsFromStorage(false);
    });

    this.events.subscribe("contact:deleted", (data) => {
      let contactid = data["contactid"];
      this.utilsProvider.modifyKeysAndValues(contactid, this.directorykeys, this.directoryvalues);
    });

    this.events.subscribe("contact:updated", (data) => {
      let updatedcontact = data["contact"];
      for (let key of this.directorykeys) {
        let totalcontacts = this.directoryvalues[key].length;
        let found = false;
        for (let i = 0; i < totalcontacts; i++) {
          let contact = this.directoryvalues[key][i];

          if (contact.localid == updatedcontact.localid) {
            found = true;
            this.directoryvalues[key][i] = updatedcontact;
            break;
          }
        }
        if (found) {
          break;
        }
      }
    });

    this.events.subscribe("contact:inserted", (data) => {
      let insertedcontact = data["contact"];
      let contactinsertedindirectory = false;
      for (let key of this.directorykeys) {
        if (key == insertedcontact.firstname.toUpperCase().charAt(0)) {
          // prevent duplicated contact
          let found = false;
          for (let contact of this.directoryvalues[key]) {
            if (contact.id == insertedcontact.id) {
              found = true;
              break;
            }
          }
          if (found) {
            console.info('This contact is duplicated.', insertedcontact);
            break;
          }
          this.directoryvalues[key].push(insertedcontact);
          contactinsertedindirectory = true;
          this.directoryvalues[key] = this.directoryvalues[key].sort((object1, object2) => {
            if (object1.firstname < object2.firstname) {
              return -1;
            }
            if (object1.firstname > object2.firstname) {
              return 1;
            }
            if (object1.lastname < object2.lastname) {
              return -1;
            }
            if (object1.lastname > object2.lastname) {
              return 1;
            }
            return 0;
          });
          break;
        }
      }

      if (!contactinsertedindirectory) {
        let toinsertkey = insertedcontact.firstname.toUpperCase().charAt(0);
        this.directorykeys.push(toinsertkey);
        this.directorykeys.sort();
        this.directoryvalues[toinsertkey] = [];
        this.directoryvalues[toinsertkey].push(insertedcontact);
      }

    });

    this.loadingProvidder.showAlert("Please wait, Fetching contacts...");
    this.fetchContactsFromStorage(false);
  }

  doInfinite(event) {
    this.pagenumber++;
    this.fetchContactsFromStorage(true, event);
  }

  resetDirectoryValues() {
    this.directoryvalues = [];
    this.directorykeys = [];
    this.defaultdirectory = [];
  }

  fetchContactsFromStorage(isFromPaging, event = null) {
    this.contactsprovider.getDirectory(this.pagenumber).then(data => {
      let directory = data["directory"];
      if (Object.keys(directory).length == 0) {
        if (event != null) {
          event.enable(false);
        }
        this.loadingProvidder.dismissAlert();
        return;
      }

      directory = this.mergeIntoExistingDirectory(directory);
      this.showDirectory(directory);
      if (!isFromPaging) {
        this.loadingProvidder.dismissAlert();
      } else {
        event.complete();
      }
    });
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

  showDirectory(directory) {
    this.directorykeys = Object.keys(directory);
    this.directorykeys.sort();

    for (let key of this.directorykeys) {
      this.directoryvalues[key] = directory[key];
    }
  }

  openContact(contact) {
    this.contactsprovider.openContactPage(contact, this.navCtrl);
  }

  openAddContactPage() {
    this.navCtrl.push(AddContactPage, {});
  }
}
