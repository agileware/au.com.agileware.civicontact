import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { FavouritesPage } from '../favourites/favourites';
import { HistoryPage } from '../history/history';
import { DirectoryPage } from '../directory/directory';
import { SyncProvider } from '../../providers/sync/sync';
import { DatabaseProvider } from '../../providers/database/database';
import { UtilsProvider } from "../../providers/utils/utils";
import { GroupsPage } from '../../pages/groups/groups';

import { Events } from 'ionic-angular';
import { SettingsProvider } from '../../providers/settings/settings';

/**
 * Generated class for the HomePage tabs.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  favouritesRoot = FavouritesPage
  historyRoot = HistoryPage
  directoryRoot = DirectoryPage
  groupsRoot = GroupsPage

  constructor(public navCtrl: NavController, public navParams: NavParams, public syncprovider: SyncProvider, public events: Events, public databaseProvider: DatabaseProvider,
    public utilsProvider: UtilsProvider, private settingsProvider: SettingsProvider) {

  }

  ionViewDidLoad() {
    this.syncprovider.sync().then((data) => {
      if (data["status"]) {

      }
    });

    this.utilsProvider.trackPageOpen("Home");
  }

  onTabsChange(tab) {
    this.events.publish("tabs:changed", {
      'tabindex': tab.index,
    });
  }

}
