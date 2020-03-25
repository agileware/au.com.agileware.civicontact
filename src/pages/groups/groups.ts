import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { GroupsProvider } from "../../providers/groups/groups";
import { Events } from "ionic-angular";
import { GroupContactsPage } from "../group-contacts/group-contacts";
import { UtilsProvider } from "../../providers/utils/utils";

/**
 * Generated class for the GroupsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-groups',
  templateUrl: 'groups.html',
})
export class GroupsPage {

  private groups;

  constructor(public navCtrl: NavController, public navParams: NavParams, public groupsProvider: GroupsProvider, public events: Events,
    public utilsProvider: UtilsProvider) {
    this.groups = [];
  }

  ionViewDidLoad() {
    this.utilsProvider.trackPageOpen("Groups");
    this.refreshList();

    this.events.subscribe("contact:inserted", (data) => {
      this.refreshList();
    });

    this.events.subscribe("contact:deleted", (data) => {
      this.refreshList();
    });

    this.events.subscribe("sync:force", (data) => {
      this.refreshList();
    });
  }

  refreshList() {
    this.groupsProvider.reteriveGroups().then((groups) => {
      this.groups = groups;
      this.refreshContactsCount();
    });
  }

  refreshContactsCount() {
    for (let group of this.groups) {
      this.groupsProvider.getContactsCountOfGroup(group.id).then((contactscount) => {
        group.contacts = contactscount;
      });
    }
  }

  openGroupContacts(group) {
    this.navCtrl.push(GroupContactsPage, {
      'group': group
    });
  }

}
