# CiviContact - CiviCRM contacts, groups, activities on your mobile device

CiviContact is a mobile application for Android and iOS which enables users to manage Contacts, Groups, Activities (and more!) when connected to a [CiviCRM](https://civicrm.org) integrated website. Find out more about about CiviContact at [civicontact.com.au](https://civicontact.com.au).

CiviContact has been developed using the [Ionic Framework](https://ionicframework.com/), is open source software and licensed under the [GNU Affero General Public License v3.0](LICENSE.txt).

CiviContact is available on [Google Play](https://play.google.com./store/apps/details?id=au.com.agileware.civicontact) and [Apple App Store](https://www.apple.com/itunes/).

## Requirements

CiviContact requires both a working [CiviCRM](https://civicrm.org) installation and the helper CiviCRM extension, [CiviContact API](https://github.com/agileware/au.com.agileware.civicontactapi). The [CiviContact API](https://github.com/agileware/au.com.agileware.civicontactapi) extension **must** be installed in CiviCRM for the CiviContact app to function. Contact your CiviCRM administrator if you want to use CiviContact. 

For CiviCRM Administrators, we recommend reading the [CiviContact API README](https://github.com/agileware/au.com.agileware.civicontactapi/blob/master/README.md).

## Getting Started 

Please read the [Getting Started Guide](https://agileware.com.au/civicontact/getting-started-with-civicontact/)

## Found a bug? Report it!

If you think you have found a bug, then please take the time to report the bug on Github, [New Issue](https://github.com/agileware/au.com.agileware.civicontact/issues/new).

**Bonus points** if you can provide a screenshot, steps to reproduce, your mobile device (Android or iOS and version) and a detailed description of the problem.

## How to request a new feature, share an idea or request a customised version of CiviContact

Thought of a new feature? Got an idea or maybe you are interested in a customised versions CiviContact for your organisation? Agileware do provide professional services for CiviContact. Please [contact Agileware](https://agileware.com.au/contact) to discuss your requirements and receive a quote.

## Support

Agileware can provide paid support for CiviContact. [Contact Agileware](https://agileware.com.au/contact) to discuss your requirements and receive a quote.

If you do not want to pay for support - that's cool too. Just post your support request to Github, [New Issue](https://github.com/agileware/au.com.agileware.civicontactapi/issues/new).

# For application developers only

If you are an **application developer** and want to help fix bugs, add new features or further extend CiviContact then the following sections are for you.

## How to set up your development environment

CiviContact was developed using:

1. Node.js, v10  
2. Ionic CLI, v5  
3. Cordova, v9

Perform these steps to set up your development environment:

1. Install [nvm](https://github.com/nvm-sh/nvm#install--update-script) to manage node.js.
2. CiviContact was developed using Node.js v10, install this version:
3. `nvm install 10`
3. `nvm use 10`

## How to build CiviContact

1. Fork the CiviContact git repository, [https://github.com/agileware/au.com.agileware.civicontact](https://github.com/agileware/au.com.agileware.civicontact)
2. Download the CiviContact source code
3. Change to the project **root directory**
4. Install all dependencies, `npm install` 
5. Install Ionic CLI, `npm install ionic@5 --save`
6. Install Cordova, `npm install cordova@9 --save`
7. Build the app for Android, `npm ionic cordova build android`
8. Build the app for iOS, `npm ionic cordova build ios`
9. The location of the compiled files will be output in the console.

## How to test CiviContact

Use the command `ionic cordova emulate` to launch the CiviContact in a local simulator/emulator. Please read the [ionic cordova emulate](https://ionicframework.com/docs/cli/commands/cordova-emulate) documentation for more information.

## How to publish on Google Play or Apple App Store

For Android, [sign the APK](https://ionicframework.com/docs/v1/guide/publishing.html) before you upload to Play Store. Please read the [instructions for publishing on the Google Play Store](https://ionicframework.com/docs/publishing/play-store).

For iOS, please read the [instructions for publishing on the Apple App Store](https://ionicframework.com/docs/publishing/app-store).

### For iOS, disable the Google Ad framework

For iOS builds, disable the Google Ad Framework to avoid warnings on submission in iTunes, specifically this message: 

> Your app is using the Advertising Identifier (IDFA). You must either provide details about the IDFA usage or remove it from the app and submit your binary again.

Open the following file:
**plugins/cordova-plugin-google-analytics/plugin.xml**

Comment out the following lines.

```
<framework src="AdSupport.framework" />
<source-file src="ios/libAdIdAccess.a" framework="true" />
```

And then remove the following files from the project.

```
AdSupport.framework
ios/libAdIdAccess.a
```

## About the Authors

CiviContact mobile application and CiviContactAPI was developed by the team at [Agileware](https://agileware.com.au).

[Agileware](https://agileware.com.au) provide a range of CiviCRM services including:

  * CiviCRM migration
  * CiviCRM integration
  * CiviCRM extension development
  * CiviCRM support
  * CiviCRM hosting
  * CiviCRM remote training services
  * And of course, CiviContact development and support

Support your Australian [CiviCRM](https://civicrm.org) developers, [contact Agileware](https://agileware.com.au/contact) today!

![Agileware](logo/agileware-logo.png)
