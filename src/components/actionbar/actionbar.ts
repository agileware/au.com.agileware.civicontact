import { Component } from '@angular/core';
import { ContactsProvider } from '../../providers/contacts/contacts';
import { Events, PopoverController } from 'ionic-angular';
import { FavouritesProvider } from '../../providers/favourites/favourites';
import { CallHistoryProvider } from '../../providers/call-history/call-history';
import { DatabaseProvider } from '../../providers/database/database';
import { MenuController } from 'ionic-angular/components/app/menu-controller';

/**
 * Generated class for the ActionbarComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'actionbar',
  templateUrl: 'actionbar.html'
})
export class ActionbarComponent {

  public searchInput;
  public placeholder = "Search favourites";
  public currentindex = 0;

  constructor(public contactsProvider: ContactsProvider, public events: Events, public favouritesProvider: FavouritesProvider,
    public callHistoryProvider: CallHistoryProvider, public databaseProvider: DatabaseProvider, private popoverController: PopoverController,
    private menuCtrl: MenuController) {
    this.events.subscribe("tabs:changed", (data) => {
      this.currentindex = data.tabindex;
      if (data.tabindex == 0) {
        this.placeholder = "Search favourites";
      }

      if (data.tabindex == 1) {
        this.placeholder = "Search history";
      }

      if (data.tabindex == 2) {
        this.placeholder = "Search contacts";
      }

      if (data.tabindex == 3) {
        this.placeholder = "Search groups";
      }
    });

    this.events.subscribe("search:forcestop", (data) => {
      this.searchInput = "";
    });

  }

  onInput(event) {
    if (this.searchInput != null && this.searchInput != "") {
      let searchContacts = {};
      if (this.currentindex == 2) {
        this.contactsProvider.searchContacts(this.searchInput).then((contactsdirectory) => {
          searchContacts = contactsdirectory;
          this.publishResult(searchContacts);
        });
      }

      if (this.currentindex == 0) {
        searchContacts = [];
        this.favouritesProvider.search(this.searchInput).then((favourites) => {
          searchContacts = favourites;
          this.publishResult(searchContacts);
        });
      }

      if (this.currentindex == 1) {
        searchContacts = [];
        this.callHistoryProvider.search(this.searchInput).then((callhistories) => {
          searchContacts = callhistories;
          this.publishResult(searchContacts);
        });
      }

    } else {
      this.events.publish("search:stopped", {
        'tabindex': this.currentindex
      });
    }
  }

  publishResult(searchContacts) {
    this.events.publish("search:started", {
      'contacts': searchContacts,
      'tabindex': this.currentindex
    });
  }

  openMoreMenu(event) {
    this.menuCtrl.open().then(value => {
    })
  }
}
