# NYC Street Closures 
## (Stevens Institute of Technology | CS 546 Project)

A web app for tracking street closures across New York City.

Our application provides a user-inputted detection system for road / construction closures and delays in traffic or parking. Users can create an account and report closures on top of City-Wide data sets providing updates. User-inputted searches of local city areas / streets will narrow down closures and provide estimates of the size of closure / lengths of closure. There will be memory retention of road closure history and behavior, along with cataloging frequency of reports from official and user data.

## Core Features
* User Account Creation and Login System - Users can register and create an account using a unique username and a password. Using the account information, the user can log in to their account, where personalized data will be stored. 
* User-Reported Closures - Users can report closures themselves using their current location OR through manual input (ex. a closure on street X, from street Y to Z).
If the closure has already been reported, the user can confirm that there is a road closure. 
* Saved Streets - Users can save streets that they typically drive on.
The user will be notified if a street that they have saved has a closure.
* Street Data Filter - Street closure will include both official data and user-reported data. Users have the option to filter data to use exclusively official NYC-reported data or user-reported data. 
* Duration of Closures - Users can see how long a road was closed whether it was a day, a week, or more.
Road Closure History - Users input a specific road was closed and see the other times it has been closed.
* Closures Near You: User pins their current location to instantly find nearby closures – no searching required.
* Street Name Search: Enter any street name to pull up all reported closures in and around that area, with details and status.

## Additional Features
* Accessibility Info - Allow users to record extra information such as if a sidewalk is also impacted or businesses are inaccessible

## Getting Started

### Prerequisites

- Node.js
- MongoDB running locally

### Install dependencies

```bash
npm install
```

### Seed the database (optional)

```bash
npm run seed
```

### Run

```bash
npm start
```

The app is served at `http://localhost:3000`.

## Data Sources
The app pulls from NYC Open Data (Socrata) datasets.
User-reported closures are stored locally in MongoDB.

### Authors

* Aaron Shieh
* Carlos Orta
* Jeffrey Kersh
* Joshua Silva
* Samuel Malwal