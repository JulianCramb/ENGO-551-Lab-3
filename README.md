# Project 3 - Leaflet geoweb app

## Overview

This project is a web app that has a user navigable map on it, initially centered around Calgary. The user is able to search for a specific date range using a search tool below the map. Once the search has been performed, markers will appear that display the buidling permits that were issued within the date range selected. The user may select a new date range at any time and the map will reload with the new building permits.

### File Structure

#### JavaScript Files  

1. **Script.js**
   - This is where the backend of the webapp lies, it contains all the functions and scripting used to link the two APIs and the plug-ins so that they can all work seamlessly. This script uses the Spiderfier overlapping plug-in and the leaflet clustering plug-in to make the map more visually appealing.
   
#### HTML Files

1. **Index.HTML**
   - This is the main and only page of this webapp, it is very simple and contains the stylesheets required for the plug-ins. The main body contains the map itself and the search bar.
   
#### Stylesheets

1. **style.css**
   - CSS stylesheet used for the HTML.
