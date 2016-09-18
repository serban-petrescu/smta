# Serban's Diploma (public)
My bachelor degree project source files.

## Overview
### Brief
The project tackles the issue of tracking, managing and analyzing shipment transports for the transport insurance industry, while using mostly technologies centered around the HANA Cloud Platform (HCP).

### Business Background
Transport companies sign contracts and buy insurance policies from specialized insurance companies to protect themselves from the risk that the transported goods are damaged during shipments. Insurance policy coverages for these situations generally contain limitations to the conditions, schedule and route on which the shipment is done. Also, insurance companies determine the premium amount (the sum of money that the transport company must regularly pay) based on various statistics and risk rates (which may vary depending on the route, schedule and even the persons involved in a shipment). 

### Goals
The project aims to shwocase the capabilities of HCP by building a system that can:
+	Be used to manage the shipment and insurance information (i.e. to store, maintain and expose it in a structured format).
+	Track in real-time the location and environmental parameters of any transport.
+	Constantly check the location, time and environmental parameter values against user-maintained limits (which correspond to insurance coverage conditions) and send email notifications to interested parties when the limits are breached.   
+	Aggregate the data collected from previous or undergoing transports and generate statistics, evolution graphs, transport comparisons and simple forecasts.

### Components
+ A cloud-hosted suite of JavaScript services for collecting and processing the data.
+ A cloud-hosted Java micro-service for issuing the email notifications.
+ Several web (UI5) applications for consuming the above mentioned services.
+ Two tracking device prototypes for testing and validating the system (note that the solution accepts tracking information from any type of device, not only the prototypes designed as part of this project).

The JavaScript cloud services are implemented directly on a SAP HANA database, which is also used for persisting all the system’s data. The communication between the tracking devices and the cloud landscape is done through HTTP messages with JSON bodies.

The Email micro-service was implemented in Java EE and a specialized grammar was created for building HTML email messages. To interpret these email message templates, a LL parser was generated from the grammar. During runtime, this service is called by the JavaScript services (through an HTTP endpoint) and an email message is generated from the preconfigured templates in conjuncture with the data sent by the calling service.

The first tracking device is based on an Arduino board, with GPS and Bluetooth modules attached (commanded through a serial interface). This prototype sends its data to a Bluetooth enabled device (a laptop), which redirects the data to the cloud. The second device is an Android application which collects data from the built-in GPS and sensors and sends the data directly to the cloud services.

## Installation
### Prerequisites
A trial HCP account is needed. On this account, a trial MDC database must have been create and the login use (e.g. SYSTEM) must have been given all rpiviledges needed for using the Web-based Workbench, the XS Admin tools and the HANA PAL stored procedures.

### HANA artifacts
1. Create a new package named `spet.diploma`.
2. Import all the artifacts from [hana/spet/diploma](./hana/spet/diploma) into this package (zip the folder and import it via the Web-based Workbench).
3. Activate all files in the following order:
  * `data::SPET_DIPLOMA.hdbschema`
  * `data::ctxCore.hdbdd`, `data::ctxRaw.hdbdd` and `data::ctxPal.hdbdd`
  * all files of the `data.import package`.
  * `procedures::equalizeValues.hdbtablefunction`
  * all remaining files from the `procedures` package
  * all files of the `model` package
  * `public::anonymous.xssqlcc`
  * all remaining inactive files.
4. Run the `data.import::import.sql` file.
5. Make a new user (or simply use the SYSTEM one) and grant it the `diplomaXSSQLCC.hdbrole` role.
6. Maintain the details this user for the `public::anonymous.xssqlcc` in the XS Admin page.
7. Import the HTTPS certificate of the Email Service Java application (see below) in the HANA trust store.
8. Maintain the details for your P-user account and HANA trust store in the `library::mail.xshttpdest` destination configuration in the XS Admin page.
9. Adjust the `library::constants.xsjslib` file by changing the GMail address.

### Java Email service
1. Import the [mail](./mail/) project into Eclipse.
2. Adjust the `/mail/src/diploma/services/mail/Configuration.json` file and add your own GMail address.
3. Add the Web Tomcat 7 HCP runtime to the project (see <https://tools.hana.ondemand.com/#cloud>).
4. Deploy the application to your HCP.
5. Import the following destinations to the HCP account: [INET_HTTP_DIPLOMA_J0I](./dest/INET_HTTP_DIPLOMA_J0I.txt) and [INET_HTTP_GOOGLE_MAPS_API](./dest/INET_HTTP_GOOGLE_MAPS_API.txt). 
6. Adjust the details (the URL) in the `INET_HTTP_DIPLOMA_J0I` to point towards your HANA MDC instance.
7. Import the [MAIL_DIPLOMA_GMAIL](./dest/MAIL_DIPLOMA_GMAIL.txt) destination into the destinations of the Java application and adjust the GMail address and password.
8. Import the certificate from the HANA instance into the trust store of your HCP account.

### UI5 Applications
1. Import each of the folders in the [ui](./ui/) folder as a HTML5 application, except for the [ui/launchpad](./ui/launchpad/) one (you can zip each folder and simply import each of them directy in the HCP Cockpit). 
2. Activate all of the created HTML5 applications.
3. Make a zip archive out of the [launchpad](./ui/launchpad/) folder.
4. Open the Fiori Launchpad (it's under Substribed Applications in the HCP account) --> Manage Site --> Services and Tools --> Transport Manager --> Import --> Select the `launchpad.zip` created previously.

### Devices
#### Arduino
1. The [arduino/device.ino](./arduino/device.ino) might need to be adjusted to work with the hardware that you have. It was tested with [Arduino Uno](https://www.arduino.cc/en/Main/ArduinoBoardUno), [GPS-MOD Module](https://www.robofun.ro/mod-gps) and a serially commanded bluetooth module (like this [one](http://www.ebay.de/itm/like/401051947373?lpid=106&chn=ps&ul_noapp=true)). 
2. The source file must be uplaoded to the arduino board and must be paired with the laptop. On the laptop, the bluetooth module input must be [mapped to a COM port](http://www.verizonwireless.com/support/knowledge-base-20605/). You can test then the connection by listening to the port with a software such as HyperTerminal. 
3. Open up the [proxy](./proxy/) C# project in Visual Studio.
4. Add the OpenUI5 runtime resources to the `www/resources/` folder. You can download them [here](http://openui5.org/download.html).
5. Adjust the file `Model.cs` to reflect the path to you HANA MDC (line 61).
6. Run the C# app and instruct it to listen to the mapped COM port.

#### Android
The sources for the Andoid application are in the [android](./android/) folder. Only the `diploma.android.client.SimpleHttpClient` class must be adjusted with the URL to the HANA MDC. Afterwards, the application can be directly run on any Android phone (with high enough API level).

## Acknowledgements
The project uses the following open-source libraries (licenses in the [licenses](./licenses/) folder):
+ OpenUI5 https://github.com/SAP/openui5/
+ Grammatica https://github.com/cederberg/grammatica
+ Jackson https://github.com/FasterXML/jackson
+ TinyGPS https://github.com/mikalhart/TinyGPS 
