/**
 * Recoreds the current window, the window that was active before it, and the time it was active, and the current mouse position 
 * Stores these values into a file for reporting at a future date.
 * 
 * 
 * On internval 
 * - See if the data has changed since last time, if so then write to file.
 * - if the data has not changed, and keyframe has expired, write to file with the same data.
 * - Else do nothing
 * 
 * Data should be a JSON payload. 
 * On intervale it should be wrrtine to a SQLITE database
 * 
 */

const windowAPIHelper = require("./windowsAPIHelper.js");
const fs = require("fs");
const { snapshot } = require("process-list");

const settings = {

	// Version number 
	buildNumber: 2,

	// The amount of time between checks 
	intervalMS: 1000 * 1,

	// The amount of time before a keyframe is written to the file
	keyFrameMS: 1000 * 60 * 5,

	// The delta mouse position before a keyframe is written to the file
	keyFrameMouseDelta: 30,
};


// List of events that trigger a write to a file. 
const ACTIVITY_NONE = false;
const ACTIVITY_WINDOW_CHANGE = "windowChange";
const ACTIVITY_MOUSE_MOVE = "mouseMove";
const ACTIVITY_KEYFRAME = "keyFrame";


// Storage for the last recored time to the file.
let lastFrame = {
	windowInfo: {
		windowText: "",
		windowModuleFileName: "",
	},
	cursorPos: {
		x: 0,
		y: 0,
	},
	tasklist: {
		name: '',
		path: '',
		cmdline: ''
	},
	timeMS: 0,
	activity: ACTIVITY_NONE,
};


// Get the file name on start up. 
function GetFileName() {
	var date = new Date();
	var fileName = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + ".csv";
	return fileName;
}

function SanatizeText(text) {
	// Remove commas from the text 
	var newText = text.replace(/,/g, "");
	return newText;
}

// Update last frame 
function UpdateLastFrame(activity, info) {
	// Update the last frame
	lastFrame.windowInfo = info.windowInfo;
	lastFrame.cursorPos = info.cursorPos;
	lastFrame.tasklist = info.tasklist;
	lastFrame.activity = activity;
	var date = new Date();
	lastFrame.timeMS = date.getTime();
}


/*
foregroundWindowInfo:  {
	windowInfo: {
		hwnd: 1116500,
		pid: 30340,
		windowModuleFileName: 'C:\\Program Files\\nodejs\\node.exe',
		windowText: 'index.js - ForegroundWindowTracker - Visual Studio Code'
	},
	cursorPos: { x: 1601, y: 1107 }
}
*/
function WriteToFile(fileName, activity, foregroundWindowInfo) {
	UpdateLastFrame(activity, foregroundWindowInfo);

	// Create the text 
	var date = new Date();
	var text = date.toISOString() + ","
		+ activity + ","
		+ foregroundWindowInfo.cursorPos.x + ","
		+ foregroundWindowInfo.cursorPos.y + ","
		+ SanatizeText(foregroundWindowInfo.windowInfo.windowModuleFileName) + ","
		+ SanatizeText(foregroundWindowInfo.windowInfo.windowText) + ","
		+ SanatizeText(foregroundWindowInfo.tasklist.name) + ","
		+ SanatizeText(foregroundWindowInfo.tasklist.path) + ","
		+ SanatizeText(foregroundWindowInfo.tasklist.cmdline);

	console.log(text);
	text += "\n"; // Add the new line after printing to the screen

	// Write the text to the file
	fs.appendFile(fileName, text, function (err) {
		if (err) {
			console.log("Error writing to file: " + fileName);
			// Don't throw an error, just keep going.
		}
	});
}

// ------------------ Main ------------------ 

console.log("Starting Build: " + settings.buildNumber);
console.log("fileName: " + GetFileName());
// Add header 
fs.appendFile(GetFileName(), "time,activity,mouseX,mouseY,windowModuleFileName,windowText,name,path,cmdline\n", function (err) {
	if (err) throw err;
});

function CheckForActivity(foregroundWindowInfo) {

	// Check to see if the window has changed
	if (lastFrame.windowInfo.windowText != foregroundWindowInfo.windowInfo.windowText ||
		lastFrame.windowInfo.windowModuleFileName != foregroundWindowInfo.windowInfo.windowModuleFileName) {
		return ACTIVITY_WINDOW_CHANGE;
	}

	if (lastFrame.tasklist.name != foregroundWindowInfo.tasklist.name ||
		lastFrame.tasklist.path != foregroundWindowInfo.tasklist.path ||
		lastFrame.tasklist.cmdline != foregroundWindowInfo.tasklist.cmdline) {
		return ACTIVITY_WINDOW_CHANGE;
	}

	// Check to see if the mouse has moved more than the delta
	if (Math.abs(lastFrame.cursorPos.x - foregroundWindowInfo.cursorPos.x) > settings.keyFrameMouseDelta ||
		Math.abs(lastFrame.cursorPos.y - foregroundWindowInfo.cursorPos.y) > settings.keyFrameMouseDelta) {
		return ACTIVITY_MOUSE_MOVE;
	}

	// Check for keyframe timeout 
	var date = new Date();
	var timeMS = date.getTime();
	if (timeMS - lastFrame.timeMS > settings.keyFrameMS) {
		return ACTIVITY_KEYFRAME;
	}

	// add a period to the control no carriage return
	process.stdout.write(".");
	return ACTIVITY_NONE; // No activity
}


async function main() {
	let info = {
		windowInfo: windowAPIHelper.getForegroundWindowInfo(),
		cursorPos: windowAPIHelper.getCursorPos()
	}
	const tasks = await snapshot('pid', 'name', 'path', 'cmdline');
	for (let i = 0; i < tasks.length; i++) {
		if (tasks[i].pid == info.windowInfo.pid) {
			info.tasklist = tasks[i];
			break;
		}
	}

	// console.log(info);

	// Check to see if we need to log this activity.
	let activity = CheckForActivity(info);
	if (activity != ACTIVITY_NONE) {
		WriteToFile(GetFileName(), activity, info,);
	}
}

setInterval(main, settings.intervalMS);
