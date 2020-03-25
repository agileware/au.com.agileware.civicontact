import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { CallHistoryProvider } from '../../providers/call-history/call-history'
import { ContactsProvider } from '../../providers/contacts/contacts';
import { UtilsProvider } from '../../providers/utils/utils';
import { Events } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { EditHistoryPage } from "../edit-history/edit-history";

/**
 * Generated class for the HistoryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-history',
  templateUrl: 'history.html',
})
export class HistoryPage {

  public callhistories = [];
  public defaultCallHitories = [];
  public isSearching: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public callhistoryprovider: CallHistoryProvider,
    public contactsprovider: ContactsProvider, public utilsProvider: UtilsProvider, public events: Events,
    public databaseProvider: DatabaseProvider) {
    this.callhistories = [];
  }

  ionViewWillLeave() {
    if (this.isSearching) {
      this.events.publish("search:forcestop", {
        "from": "history"
      });
      this.isSearching = false;
      this.sortAndSetCallHistories(this.defaultCallHitories);
    }
  }

  ionViewDidLoad() {

    this.utilsProvider.trackPageOpen("Call History");

    this.events.subscribe("search:started", (data) => {
      if (data["tabindex"] == 1) {
        this.isSearching = true;
        let callhistories = data["contacts"];
        this.sortAndSetCallHistories(callhistories);
      }
    });

    this.events.subscribe("callhistory:inserted", (data) => {
      if (typeof data["fromdevice"] !== "undefined" && data["fromdevice"]) {
        this.refreshList();
      }
    });

    this.events.subscribe("histories:saved", (data) => {
      this.refreshList();
    });

    this.events.subscribe("search:stopped", (data) => {
      if (data["tabindex"] == 1) {
        this.isSearching = false;
        this.sortAndSetCallHistories(this.defaultCallHitories);
      }
    });

    this.events.subscribe("contact:deleted", (data) => {
      let contactid = data["contactid"];
      let total = this.callhistories.length;
      let indexes = [];
      for (let i = 0; i < total; i++) {
        if (this.callhistories[i].contact.localid == contactid) {
          indexes.push(i);
        }
      }
      for (let index of indexes) {
        this.callhistories.splice(index, 1);
      }
    });

    this.events.subscribe("contact:updated", (data) => {
      let updatedcontact = data["contact"];
      let total = this.callhistories.length;

      for (let i = 0; i < total; i++) {
        if (this.callhistories[i].contact.localid == updatedcontact.localid) {
          this.callhistories[i].contact = updatedcontact;
        }
      }
    });

    this.refreshList();
  }

  refreshList() {
    this.callhistoryprovider.retrieve().then((data) => {
      let callhistories = data["callhistories"];

      if (callhistories != null) {
        this.defaultCallHitories = callhistories;
        this.sortAndSetCallHistories(callhistories);
      }
    });
  }

  sortAndSetCallHistories(callhistories) {
    this.callhistories = callhistories.sort((object1, object2) => {
      if (object1.activitydatetime > object2.activitydatetime) {
        return -1;
      }
      if (object1.activitydatetime < object2.activitydatetime) {
        return 1;
      }
      return 0;
    });
  }

  callContact(history) {
    this.utilsProvider.call(history.contact).then((data) => {
      if (data["status"]) {
        this.databaseProvider.recordCallHistory(history.contact, '').then((data) => {
          this.navCtrl.push(EditHistoryPage, {
            'callhistory': data["history"],
          });
        });
      }
    });
  }

  openContactPage(history) {
    this.contactsprovider.openContactPage(history.contact, this.navCtrl);
  }

}
