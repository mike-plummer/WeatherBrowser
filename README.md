# WeatherBrowser
Example of client-side geospatial visualization using TurfJS. 

### Description
This application uses Tornado incidence data for the past 60 years as recorded by the US Government to demonstrate the ability to plot, adjust, analyze, and aggregate geospatial information using a series of Javascript libraries. Due to the large dataset (almost 50,000 individual tornadoes with close to 100,000 geographic points) the map displays events one year at a time. For each year, an optional HeatMap can be enabled to display 'hot spots' of activity for that year. There is an additional overall HeatMap that shows hot spots over the entirety of the 60 year dataset. By clicking an individual US state on the map aggregate data is displayed for tornadoes in that state over time. All of the number-crunching is done client-side - the server only supplies the raw GeoJSON data. Due to security restrictions in the browser it is necessary to run this application using a web server like Jetty or Tomcat, or deploy it to a hosting provider like Heroku.

### Usage
1. Clone this repository. Ensure that you have Gradle available in your local environment.
2. In a command prompt from the root directory of the repository execute `gradle jettyRun`.
3. Open a browser and navigate to `http://localhost:7777/WeatherBrowser/index.html`. Since this application is very JavaScript-heavy it is recommended you use Chrome, Safari, or Firefox.
4. When finished, stop the server in the command prompt with `Ctrl-C`

### Tools & Frameworks
- [jQuery]
- [Leaflet]/[Mapbox]
- [TurfJS]
- [JS Range Slider]
- [HTML5 UP Highlights]

### Data
Weather data is courtesy of the National Oceanographic and Atmospheric Administration (NOAA) USA [Severe Weather Data Inventory] (SWDI).
Geographic data is courtesy of OpenStreetMap and [Data Packaged Core Datasets].

### Implementation Notes
1. By default the embedded Jetty server does not enable GZIP compression. This is obviously silly for this application due to the very large amounts of textual (GeoJSON) data being transmitted. Enabling GZIP cuts the size of the tornado data file from 9.8 to 0.7 MB. However, in a development environment this data is exchanged locally, not over the wire, so it is a non-issue. If deploying to Heroku or another remote system it is highly recommended that GZIP/Deflate be enabled.
2. The data from NOAA was originally in a CSV format which I preprocessed into GeoJSON using a quick-and-dirty Grails application. The code is not being published at this time since it is not intended for reuse but I will make it available if requested.
3. I would estimate the accuracy of my data translation at 95%, and I cannot guarantee the original data source was not missing some data. If a specific storm you're looking for is missing or mislabeled I apologize, but remember that this application is not intended to be an authoritative source for this data.

### Development
All code and scripts were developed on a 64-bit Ubuntu 15.04 platform and has been verified to function in the latest builds of Chrome, Firefox, and Safari in Ubuntu and OS X (10.10.4). Other OS/Hardware/Software combos may require modifications.

### Licensing
This code is provided under the terms of the MIT license: basically you're free to do whatever you want with it, but no guarantees are made to its validity, stability, or safety. All works referenced by or utilized by this project are the property of their respective copyright holders and retain licensing that may be more restrictive.

[jQuery]:https://jquery.com/
[Leaflet]:http://leafletjs.com/
[Mapbox]:https://www.mapbox.com/
[TurfJS]:http://turfjs.org/
[JS Range Slider]:https://github.com/razorfish/JS-Range-Slider
[HTML5 UP Highlights]:http://html5up.net/highlights
[Severe Weather Data Inventory]:http://catalog.data.gov/dataset/severe-weather-data-inventory-swdi
[Data Packaged Core Datasets]:https://github.com/datasets/geo-boundaries-us-110m
