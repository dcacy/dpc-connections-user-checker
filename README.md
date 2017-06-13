# dpc-connections-user-checker

This utility allows you to get a list of all the managers in your organization, and then shows
their direct reports and the most recent updates of those direct reports. This application works 
on both Connections on premises and Connections Cloud.

## Getting Started 

1. Your Connections environment must have managers designated in their Profiles. For on premises Connections,
see [here](https://ibm.biz/Bdiudg); for Connections Cloud, see [here](https://ibm.biz/Bdiuxd).

1. Copy the file `connections-sample.properties` to `connections.properties`.

1. Edit `connections.properties`, providing the correct Connections host name, as well as an ID and password.

1. Download `jquery.loadmask.min.js` from [https://github.com/wallynm/jquery-loadmask](https://github.com/wallynm/jquery-loadmask) and copy it to the `public/js` directory.

1. Download `jquery.loadmask.css` from [https://github.com/wallynm/jquery-loadmask](https://github.com/wallynm/jquery-loadmask) and copy it to the `public/css` directory.

1. Install dependencies:
```
npm install
```
1. Run the application:
```
npm start
```
