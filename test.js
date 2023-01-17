const windowHelper = require("./windowsHelper.js");
const { snapshot } = require("process-list");

async function Get() {
  let info = {
    windowInfo: windowHelper.getForegroundWindowInfo(),
    cursorPos: windowHelper.getCursorPos()
  }

  const tasks = await snapshot('pid', 'name', 'path', 'cmdline');
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].pid == info.windowInfo.pid) {
      // console.log("Found a match: ", tasks[i]);
      info.tasklist = tasks[i];
      break;
    }
  }
  console.log(info);
}

setInterval(Get, 1000);

// setInterval(() => {
//   try {
//     let info = {
//       windowInfo: windowHelper.getForegroundWindowInfo(),
//       cursorPos: windowHelper.getCursorPos()
//     }
//     console.log(info);


//     const tasks = await snapshot('pid', 'name', 'path');
//     for (let i = 0; i < tasks.length; i++) {
//       if (tasks[i].pid == info.windowInfo.pid) {
//         console.log("Found a match: ", tasks[i]);
//         break;
//       }
//     }

//     // snapshot('pid', 'name', 'path').then((tasks) => {
//     //   // Search though the tasks for a match task with the same pid as the foreground window
//     //   for (let i = 0; i < tasks.length; i++) {
//     //     if (tasks[i].pid == info.windowInfo.pid) {
//     //       console.log("Found a match: ", tasks[i]);
//     //       break;
//     //     }
//     //   }
//     // });


//   } catch (error) {
//     console.log(error);
//   }


// }, 1000);