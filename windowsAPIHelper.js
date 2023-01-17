/**
 * 
 * Adapted from https://www.demo2s.com/node.js/node-js-development-process-foreground-window-gets-the-process-id-pi.html
 */

var getForegroundWindowInfo;
var getCursorPos;
var openProcess;

if (process.platform === 'win32') {
  var ref = require('ref-napi');
  var ffi = require('ffi-napi');


  var intPtr = ref.refType(ref.types.int32);
  var user32 = ffi.Library('user32', {
    'GetForegroundWindow': ['int', []],
    'GetWindowThreadProcessId': ['int', [ref.types.int32, intPtr]],
    "GetWindowTextA": ["int32", ["int32", "string", "int32"]],
    "GetWindowModuleFileNameA": ["int32", ["int32", "string", "int32"]],
    "GetCursorPos": ["bool", ['pointer']],
  });

  var kernel32 = ffi.Library('kernel32', {
    "OpenProcess": [intPtr, ["uint32", "bool", "uint32"]],
    "GetPackageId": ["long", ["uint32", "pointer", "pointer"]],


    // "EnumProcessModules": ["bool", ["uint32", "pointer", "uint32", "pointer"]],
    // "GetModuleBaseNameA": ["uint32", ["uint32", "uint32", "string", "int32"]],
  });

  openProcess = function (dwProcessId) {

    // https://stackoverflow.com/questions/32360149/name-of-process-for-active-window-in-windows-8-10


    let active_process = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, dwProcessId);
    GetProcessImageFileName(active_process, image_name, 512);


    let dwDesiredAccess = 0x0400; // PROCESS_QUERY_LIMITED_INFORMATION
    let openProccessResults = kernel32.OpenProcess(dwDesiredAccess, false, dwProcessId);
    if( openProccessResults == 0 ){
      console.log("OpenProcess Error: " + openProccessResults);
      return "";
    }

    let buffer = new Buffer(100); // 8192 is first pow-of-2 which works for max-title-length Chrome tabs
    let bufferLength = ref.alloc(ref.types.uint32);
    bufferLength.writeInt32LE(100);
    
    let results = kernel32.GetPackageId(openProccessResults, bufferLength, buffer);
    if( results != 0 ){
      // https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-?redirectedfrom=MSDN
      console.log("GetPackageId Error: " + results);
      return "";
    }

    console.log(results)
    console.log(buffer)
    console.log(bufferLength.deref())

    return buffer;

    // let hMod = ref.alloc(ref.types.uint32);
    // let cbNeeded = ref.alloc(ref.types.uint32);
    // if (kernel32.EnumProcessModules(openProccessResults, hMod, ref.sizeof(hMod), cbNeeded)) {
    //   let szProcessName = new Buffer(260);
    //   let dwSize = ref.alloc(ref.types.uint32);
    //   dwSize.writeInt32LE(260);
    //   kernel32.GetModuleBaseNameA(openProccessResults, hMod, szProcessName, dwSize);
    //   console.log(szProcessName.toString());
    //   return szProcessName;
    // }
    return "";
  }


  getForegroundWindowInfo = function () {
    var results = {};

    // Get the windows handel
    results.hwnd = user32.GetForegroundWindow();

    // Get the process id.
    var pid = ref.alloc(ref.types.int32);
    user32.GetWindowThreadProcessId(results.hwnd, pid);
    results.pid = pid.deref();

    // Set up a buffer to hold the window text.
    const buffer = new Buffer(8192); // 8192 is first pow-of-2 which works for max-title-length Chrome tabs
    buffer["type"] = ref.types.CString; // when commented, apparently works fine anyway! (still keeping though, jic)

    // Get the application name. 
    let lengthAppName = user32.GetWindowModuleFileNameA(results.hwnd, buffer, buffer.length);
    results.windowModuleFileName = buffer.toString().substr(0, lengthAppName);

    // Get the application title. 
    let lengthAppTitle = user32.GetWindowTextA(results.hwnd, buffer, buffer.length);
    results.windowText = buffer.toString().substr(0, lengthAppTitle);
    return results;
  }

  getCursorPos = function () {
    var results = {};

    var repbuffer = new Buffer(16); // holder for windows structures
    var points = user32.GetCursorPos(repbuffer);

    results.x = repbuffer[0] + (repbuffer[1] * 256);
    results.y = repbuffer[4] + (repbuffer[5] * 256);
    return results;

  };
} else {
  throw new Error("Platform not supported: " + process.platform);
}

module.exports = {
  getForegroundWindowInfo, getCursorPos, openProcess
}