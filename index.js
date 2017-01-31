const {remote, ipcRenderer} = require('electron')
const {Menu, MenuItem} = remote
const {dialog} = remote

function saveAs() {
  var fileName = dialog.showSaveDialog(fileDialogOptions);
  if(fileName) {
      window.dispatchEvent(new CustomEvent('saveas', {'detail':fileName}));
  }
}

const fileDialogOptions = {
  filters: [
    {name: 'JSON File Type', extensions: ['json']},
    {name: 'All Files', extensions: ['*']}
  ]
};
const template = [
{
  label: "File",
  submenu: [
    {
    label: "New",
    click: (() => {
          window.dispatchEvent(new CustomEvent('new'));
    })
    },

    {
    label: "Open",
    click: (() => {
      var fileName = dialog.showOpenDialog(fileDialogOptions);
      if(fileName) {
          window.dispatchEvent(new CustomEvent('open', {'detail':fileName}));
      }
    })
    },

    {
    label: "Save",
    click: (() => {
      if(window.fileName) {
          window.dispatchEvent(new CustomEvent('save'));
      } else {
          saveAs();
      }
    })
    },

    {
    label: "Save as...",
    click: (() => {
      saveAs();
    })
    }
  ]
},
{
  label: "Task",
  submenu: [
    {
    label: "New task",
    click: (() => {
      window.dispatchEvent(new CustomEvent('newtask'));
    })
    //click () { require('electron').shell.openExternal('http://electron.atom.io') }
    }
  ]
}
];

var appName="";

ipcRenderer.on('app-name', (event, t) => {
    appName = t;
    refreshAppName();
});

function refreshAppName() {
  if(window.fileName)
    document.title = appName + " - " + window.fileName;
  else
    document.title = appName
}

window.addEventListener("refreshfilename", refreshAppName, false);

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
