/**
 * Recoreds the current window, the window that was active before it, and the time it was active, and the current mouse position 
 * Stores these values into a file for reporting at a future date.
 * 
 */

import { GetForegroundWindowHandle, GetForegroundWindowText, windowTextCaches, user32 } from "windows-ffi";
import { join } from "path";
import { appendFile } from "fs";

const intervalMS = 1000 * 3; // Every 5 seconds 

// Get the file name on start up. 
function GetFileName() {
	var date = new Date();
	var fileName = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getTime() / 1000 + ".csv";
	return fileName;
}
var fileName = GetFileName();
console.log("fileName: " + fileName);

// Add header 
appendFile(fileName, "time,mouseX,mopuseY, foregroundWindowHandle,foregroundWindowText,previousWindowHandle1, previousWindowText1, previousWindowTime1, previousWindowHandle2, previousWindowText2, previousWindowTime2\n", function (err) {
	if (err) throw err;
});

function SanatizeText(text) {
	// Remove commas from the text 
	var newText = text.replace(/,/g, "");
	return newText;
}

function WriteToFile(foregroundWindowHandle, foregroundWindowText, mouseX, mopuseY, windowTextCaches) {
	// Write the text to the file

	// Get the current time
	var date = new Date();
	var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

	// Sanatize the text
	foregroundWindowText = SanatizeText(foregroundWindowText + '');

	// Create the text 
	var text = time + "," + mouseX + "," + mopuseY + "," + foregroundWindowHandle + "," + foregroundWindowText + ",";

	// Loop thought the map and add the values to the text
	for (var [key, window] of windowTextCaches) {
		text += key + "," + window.value + "," + window.time + ",";
	}
	
	// End of line 
	text += "\n";

	// Write the text to the file
	appendFile(fileName, text, function (err) {
		if (err) throw err;
	}
	);
	console.log(text);
}





setInterval(() => {
	console.log("GetForegroundWindowHandle: " + GetForegroundWindowHandle());
	console.log("GetForegroundWindowText: " + GetForegroundWindowText());

	var repbuffer = new Buffer(16); // holder for windows structures
	user32.GetCursorPos(repbuffer)
	var x = repbuffer[0] + (repbuffer[1] * 256);
	var y = repbuffer[4] + (repbuffer[5] * 256);
	console.log("GetCursorPos: x=" + x + ", y=" + y);
	// console.log("GetDesktopWindow: ", user32.GetDesktopWindow());
	console.log("windowTextCaches: ", windowTextCaches);

	WriteToFile(GetForegroundWindowHandle(), GetForegroundWindowText(), x, y, windowTextCaches);



}, intervalMS);



