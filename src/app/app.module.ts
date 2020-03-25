import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ContactPage } from '../pages/contact/contact';

import { ContactsProvider } from '../providers/contacts/contacts';
import { HttpClientModule } from '@angular/common/http';
import { LocationTypesProvider } from '../providers/location-types/location-types';
import { SyncProvider } from '../providers/sync/sync';
import { CallHistoryProvider } from '../providers/call-history/call-history';
import { FavouritesProvider } from '../providers/favourites/favourites';
import { LoadingProvider } from '../providers/loading/loading';

import { FavouritesPage } from '../pages/favourites/favourites'
import { HistoryPage } from '../pages/history/history'
import { DirectoryPage } from '../pages/directory/directory'
import { AddContactPage } from '../pages/add-contact/add-contact'
import { WelcomePage } from '../pages/welcome/welcome'
import { SettingsPage } from '../pages/settings/settings'
import { AccountsPage } from '../pages/accounts/accounts'
import { GroupsPage } from '../pages/groups/groups'
import { GroupContactsPage } from "../pages/group-contacts/group-contacts";
import { DashboardMoreOptionsPage } from '../pages/dashboard-more-options/dashboard-more-options';
import { ActivitiesPage } from "../pages/activities/activities";
import { NewActivityPage } from "../pages/new-activity/new-activity";

import { ActionbarComponent } from '../components/actionbar/actionbar'
import { IonicStorageModule } from '@ionic/storage';

import { TimeAgoPipe } from 'time-ago-pipe'
import { BackgroundImageDirective } from '../directives/background-image/background-image'

import { UtilsProvider } from '../providers/utils/utils';

import { SQLite } from '@ionic-native/sqlite'
import { DatabaseProvider } from '../providers/database/database';
import { ContactMoreOptionsPage } from '../pages/contact-more-options/contact-more-options';

import { QRScanner } from '@ionic-native/qr-scanner';
import { ActionSheet } from '@ionic-native/action-sheet';
import { EmailsProvider } from '../providers/emails/emails';
import { ExtensionProvider } from '../providers/extension/extension';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { AppVersion } from '@ionic-native/app-version';
import { GroupsProvider } from '../providers/groups/groups';
import { MoreInformationPage } from '../pages/more-information/more-information';
import { SettingsProvider } from '../providers/settings/settings';
import { ActivitiesProvider } from '../providers/activities/activities';
import { ActivityTypesProvider } from '../providers/activity-types/activity-types';

import { DatePicker } from "@ionic-native/date-picker";
import { EditHistoryPage } from "../pages/edit-history/edit-history";
import { ProfileFieldsProvider } from '../providers/profile-fields/profile-fields';
import { CountriesProvider } from '../providers/countries/countries';
import { SelectSearchableModule } from "ionic-select-searchable";

import { AutoCompleteModule } from "ionic2-auto-complete";

import { AddContactPofileAutoCompleteFieldsService } from "../services/AddContactPofileAutoCompleteFieldsService";
import { ContactSummaryPage } from "../pages/contact-summary/contact-summary";
import { Deeplinks } from "@ionic-native/deeplinks";

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    FavouritesPage,
    HistoryPage,
    DirectoryPage,
    ActionbarComponent,
    TimeAgoPipe,
    ContactPage,
    BackgroundImageDirective,
    AddContactPage,
    WelcomePage,
    SettingsPage,
    ContactMoreOptionsPage,
    AccountsPage,
    GroupsPage,
    GroupContactsPage,
    DashboardMoreOptionsPage,
    MoreInformationPage,
    ActivitiesPage,
    NewActivityPage,
    EditHistoryPage,
    ContactSummaryPage
  ],
  imports: [
    BrowserModule,
    AutoCompleteModule,
    SelectSearchableModule,
    IonicModule.forRoot(MyApp, {
      tabsHideOnSubPages: true
    }),
    HttpClientModule,
    IonicStorageModule.forRoot(),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    FavouritesPage,
    HistoryPage,
    DirectoryPage,
    ActionbarComponent,
    ContactPage,
    AddContactPage,
    ContactMoreOptionsPage,
    WelcomePage,
    SettingsPage,
    AccountsPage,
    GroupsPage,
    GroupContactsPage,
    DashboardMoreOptionsPage,
    MoreInformationPage,
    ActivitiesPage,
    NewActivityPage,
    EditHistoryPage,
    ContactSummaryPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    ContactsProvider,
    LocationTypesProvider,
    SyncProvider,
    CallHistoryProvider,
    FavouritesProvider,
    LoadingProvider,
    UtilsProvider,
    SQLite,
    DatabaseProvider,
    QRScanner,
    ActionSheet,
    EmailsProvider,
    ExtensionProvider,
    GoogleAnalytics,
    AppVersion,
    GroupsProvider,
    SettingsProvider,
    ActivitiesProvider,
    ActivityTypesProvider,
    DatePicker,
    ProfileFieldsProvider,
    CountriesProvider,
    Deeplinks,
    AddContactPofileAutoCompleteFieldsService
  ]
})
export class AppModule {
}
