var dialog = require('electron').remote.dialog;
var fs = require('fs');
var path = require('path');
const { resolve } = require('url');

const FileSystem = function () { };

FileSystem.prototype = {
  promptUserForDirectory: function () {
    const directories = dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (directories) {
      return directories[0];
    }

    return "";
  },

  promptUserForFile: function () {
    const files = dialog.showOpenDialog({ properties: ["openFile"] });
    if (files) {
      return files[0];
    }

    return "";
  },

  fileMap: async function (directory, mapFunction, mapSubDirectories) {
    const allEntries = await this.__fsReadDir(directory);
    for (const oneEntry of allEntries) {
      if (await this.__fsIsFile(directory, oneEntry)) {
        await mapFunction(oneEntry, allEntries, directory);
      } else if (mapSubDirectories && await this.__fsIsDirectory(directory, oneEntry)) {
        await this.fileMap(path.join(directory, oneEntry), mapFunction, mapSubDirectories);
      }
    }
  },

  getFilesInDirectory: async function (directory) {
    let allFiles = [];
    const allEntries = await this.__fsReadDir(directory);
    for (const oneEntry of allEntries) {
      if (await this.__fsIsFile(directory, oneEntry)) {
        allFiles.push(oneEntry);
      }
    }

    return allFiles;
  },

  readFileContents: async function (filePath) {
    return await this.__fsReadFile(filePath);
  },

  moveFile: async function (oldDirectory, oldFileName, newDirectory, newFileName) {
    const oldFilePath = path.join(oldDirectory, oldFileName);
    const newFilePath = path.join(newDirectory, newFileName);

    await this.__fsRename(oldFilePath, newFilePath);
  },

  __fsReadDir: function (directory) {
    return new Promise((resolve, reject) => {
      fs.readdir(directory, { withFileTypes: true }, (err, entries) => {
        resolve((entries || []));
      });
    });
  },

  __fsReadFile: function (filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        resolve((data || ""));
      });
    });
  },

  __fsRename: function (oldFilePath, newFilePath) {
    return new Promise((resolve, reject) => {
      fs.rename(oldFilePath, newFilePath, (err) => {
        resolve();
      });
    });
  },

  __fsIsFile: function (directory, filePath) {
    return new Promise((resolve, reject) => {
      fs.lstat(path.join(directory, filePath), (err, stats) => {
        resolve(stats.isFile());
      });
    });
  },

  __fsIsDirectory: function (directory, filePath) {
    return new Promise((resolve, reject) => {
      fs.lstat(path.join(directory, filePath), (err, stats) => {
        resolve(stats.isDirectory());
      });
    });
  }
};
