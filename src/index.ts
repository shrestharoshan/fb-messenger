/// <reference path="../tools/typings/node/node.d.ts"/>
//@nrip - this is the browser side code for electron.
//view component folder for renderer side codes.
(function () {
    "use strict";

    let app = require('app'),
        Menu = require('menu'),
    //MenuItem = require('menu-item'),
        BrowserWindow = require('browser-window');

    require('crash-reporter').start();
    var facebookChatApiPackageInfo = require("./node_modules/facebook-chat-api/package.json");

    var mainWindow:any = null;
    var showAboutDialog = function() {
        var versions = process.versions;
        var appVersion = app.getVersion();
        const dialog = require('electron').dialog;
        dialog.showMessageBox(mainWindow, {
            type : "info",
            buttons : ["Ok"],
            title: "About fb-messenger",
            message : "fb-messenger",
            detail : "Version: " + appVersion + 
                     "\n\nShell: " + versions["electron"] + 
                     "\nRenderer: " + versions["chrome"] + 
                     "\nNode.js: " + versions["node"] +
                     "\nfacebook-chat-api: " + facebookChatApiPackageInfo.version
        });
    }

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('ready', function () {
        app.commandLine.appendSwitch("js-flags", "--harmony");
        mainWindow = new BrowserWindow({
            width: 450,
            height: 450,
            frame: true
        });
        mainWindow.loadURL('file://' + __dirname + '/index.html');
        mainWindow.on('closed', function () {
            mainWindow = null;
        });

        var template:any;
        // Example of menu from official sample
        // https://github.com/atom/electron/blob/master/atom/browser/default_app/default_app.js
        if (process.platform == 'darwin') {
            template = [{
                label: 'Electron',
                submenu: [{
                    label: 'About Electron',
                    selector: 'orderFrontStandardAboutPanel:'
                }, {
                    type: 'separator'
                }, {
                    label: 'Services',
                    submenu: []
                }, {
                    type: 'separator'
                }, {
                    label: 'Hide Electron',
                    accelerator: 'Command+H',
                    selector: 'hide:'
                }, {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    selector: 'hideOtherApplications:'
                }, {
                    label: 'Show All',
                    selector: 'unhideAllApplications:'
                }, {
                    type: 'separator'
                }, {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function () {
                        app.quit();
                    }
                },]
            }, {
                label: 'Edit',
                submenu: [{
                    label: 'Undo',
                    accelerator: 'Command+Z',
                    selector: 'undo:'
                }, {
                    label: 'Redo',
                    accelerator: 'Shift+Command+Z',
                    selector: 'redo:'
                }, {
                    type: 'separator'
                }, {
                    label: 'Cut',
                    accelerator: 'Command+X',
                    selector: 'cut:'
                }, {
                    label: 'Copy',
                    accelerator: 'Command+C',
                    selector: 'copy:'
                }, {
                    label: 'Paste',
                    accelerator: 'Command+V',
                    selector: 'paste:'
                }, {
                    label: 'Select All',
                    accelerator: 'Command+A',
                    selector: 'selectAll:'
                },]
            }, {
                label: 'View',
                submenu: [{
                    label: 'Reload',
                    accelerator: 'Command+R',
                    click: function () {
                        mainWindow.restart();
                    }
                }, {
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click: function () {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                }, {
                    label: 'Toggle Developer Tools',
                    accelerator: 'Alt+Command+I',
                    click: function () {
                        mainWindow.toggleDevTools();
                    }
                },]
            }, {
                label: 'Window',
                submenu: [{
                    label: 'Minimize',
                    accelerator: 'Command+M',
                    selector: 'performMiniaturize:'
                }, {
                    label: 'Close',
                    accelerator: 'Command+W',
                    selector: 'performClose:'
                }, {
                    type: 'separator'
                }, {
                    label: 'Bring All to Front',
                    selector: 'arrangeInFront:'
                },]
            }, {
                label: 'Help',
                submenu: [{
                    label: 'Learn More',
                    click: function () {
                        require('shell').openExternal('http://electron.atom.io')
                    }
                }, {
                    label: 'Documentation',
                    click: function () {
                        require('shell').openExternal('https://github.com/atom/electron/tree/master/docs#readme')
                    }
                }, {
                    label: 'Community Discussions',
                    click: function () {
                        require('shell').openExternal('https://discuss.atom.io/c/electron')
                    }
                }, {
                    label: 'Search Issues',
                    click: function () {
                        require('shell').openExternal('https://github.com/atom/electron/issues')
                    }
                }, {
                    label: 'About',
                    click: function () {
                        showAboutDialog();
                    }
                }]
            }];

        } else {
            template = [{
                label: '&File',
                submenu: [{
                    label: '&Open',
                    accelerator: 'Ctrl+O',
                }, {
                    label: '&Close',
                    accelerator: 'Ctrl+W',
                    click: function () {
                        mainWindow.close();
                    }
                },]
            }, {
                label: '&View',
                submenu: [{
                    label: '&Reload',
                    accelerator: 'Ctrl+R',
                    click: function () {
                        mainWindow.restart();
                    }
                }, {
                    label: 'Toggle &Full Screen',
                    accelerator: 'F11',
                    click: function () {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                }, {
                    label: 'Toggle &Developer Tools',
                    accelerator: 'Alt+Ctrl+I',
                    click: function () {
                        mainWindow.toggleDevTools();
                    }
                },]
            }, {
                label: 'Help',
                submenu: [{
                    label: 'Learn More',
                    click: function () {
                        require('shell').openExternal('http://electron.atom.io')
                    }
                }, {
                    label: 'Documentation',
                    click: function () {
                        require('shell').openExternal('https://github.com/atom/electron/tree/master/docs#readme')
                    }
                }, {
                    label: 'Community Discussions',
                    click: function () {
                        require('shell').openExternal('https://discuss.atom.io/c/electron')
                    }
                }, {
                    label: 'Search Issues',
                    click: function () {
                        require('shell').openExternal('https://github.com/atom/electron/issues')
                    }
                }, {
                    label: 'About',
                    click: function () {
                        showAboutDialog();
                    }
                }]
            }];
        }

        var menu = Menu.buildFromTemplate(template);
        mainWindow.setMenu(menu);
    });

}());
