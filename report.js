/**
 * Create a report from the logs in this directory.
 * 
 */

// List the files in this directory
var fs = require('fs');
var path = require('path');

var windowNameCount = [];

var directoryPath = path.join(__dirname, './');
fs.readdir(directoryPath, function (err, files) {
  // handling error
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }

  // Print all files in this directory
  files.forEach(function (file) {
    // only work with files with the .log extension
    if (!file.endsWith(".csv")) {
      return;
    }

    EachFile(file);
  });
});

function EachFile(file) {
  console.log("processing: " + file);

  // Read a line from the file 
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream
      (path.join(directoryPath, file))
  });

  // Read each line
  lineReader.on('line', function (line) {
    // Split the line into columns
    var columns = line.split(',');

    UpdateDatabase(columns);

  });
  console.log(file);
  console.log(windowNameCount);
};




function UpdateDatabase(columns) {
  console.log("proesssing line: ", columns );
  // Update the database with the columns
  if (columns[1] != "windowChange") {
    return; // Ingore 
  }

  let windowName = GetAppFromWindowName(columns[5]);

  windowNameCount.hasOwnProperty(windowName) ? windowNameCount[windowName]++ : windowNameCount[windowName] = 1;

  console.log(windowNameCount);
}


function GetAppFromWindowName(windowName) {

  // Split by muliple different delimiters
  windowName = windowName.split(' - ').join(' | ');
  appName = windowName.split(' | ');
  return appName[appName.length - 1];
}
