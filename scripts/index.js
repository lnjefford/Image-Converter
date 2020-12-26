var dialog = require('electron').remote.dialog;

const Index = function Index() {
  this.__fileSystem = new FileSystem();
  this.__nameFormat = new NameFormat();

  this.__cacheDOMElements();
  this.__toggleSpinner(false);
  this.__setUpFormatControls();
  this.__addHandlers();
};

Index.prototype = {
  __cacheDOMElements: function () {
    this.__$body = $("body");
    this.__$btnCurrentDir = $("#btnCurrentDir");
    this.__$spnCurrentDir = $("#spnCurrentDir");
    this.__$btnCSVFile = $("#btnCSVFile");
    this.__$spnCSVFile = $("#spnCSVFile");
    this.__$divColumns = $("#divColumns");
    this.__$sortAdd = $(".sortAdd");
    this.__$btnConvert = $("#btnConvert");
    this.__$tmplColumn = $("#tmplColumn");
    this.__$spinner = $("#spinner");
  },

  __setUpFormatControls: function () {
    this.__$oldFormat = $("#oldFormat");
    this.__$oldFormat.html(this.__nameFormat.getFormatControlHTML());
    this.__$newFormat = $("#newFormat");
    this.__$newFormat.html(this.__nameFormat.getFormatControlHTML());
  },

  __addHandlers: function () {
    this.__$btnCurrentDir.click($.proxy(this.__selectCurDir, this));
    this.__$btnCSVFile.click($.proxy(this.__selectCSVFile, this));
    this.__$sortAdd.click($.proxy(this.__addColumn, this));
    this.__$divColumns.on("click", ".remove", $.proxy(this.__removeColumn, this));
    this.__$divColumns.on("change", "input", $.proxy(this.__onColumnChange, this));
    this.__$btnConvert.click($.proxy(this.__doConversion, this));
  },

  __selectCurDir: function () {
    const directoryName = this.__fileSystem.promptUserForDirectory();
    this.__$spnCurrentDir.html(directoryName);
    this.__curDir = directoryName;
  },

  __selectCSVFile: async function () {
    const fileName = this.__fileSystem.promptUserForFile();
    this.__$spnCSVFile.html(fileName);

    const fileContents = await this.__fileSystem.readFileContents(fileName);
    this.__csvData = $.csv.toArrays(fileContents);
  },

  __addColumn: function () {
    this.__$sortAdd.before(this.__$tmplColumn.html());
    this.__onColumnChange();
  },

  __removeColumn: function (e) {
    $(e.target).closest(".sortable").remove();
    this.__onColumnChange();
  },

  __onColumnChange: function () {
    const colNames = this.__getAllColumnNames();
    colNames.unshift("");

    this.__nameFormat.updateFormatOptions(colNames);
  },

  __getAllColumnNames: function () {
    var $columnNameInputs = this.__$divColumns.find(".sortable input");
    var columnNames = [];

    for (const nameInput of $columnNameInputs) {
      columnNames.push($(nameInput).val());
    }

    return columnNames;
  },

  __getOldNameFormat: function () {
    return this.__nameFormat.getFormatFromControl(this.__$oldFormat);
  },

  __getNewNameFormat: function () {
    return this.__nameFormat.getFormatFromControl(this.__$newFormat);
  },

  __doConversion: async function () {
    this.__toggleSpinner(true);

    if (!this.__validateFields()) {
      this.__toggleSpinner(false);
      return;
    }

    const nameMap = this.__nameFormat.getOldNameToNewNameMap(this.__csvData, this.__getOldNameFormat(), this.__getNewNameFormat());
    const usedNewNames = {};

    await this.__fileSystem.fileMap(this.__curDir, async (fileName, allFileNames, directoryName) => {
      const fileNameNoExt = fileName.split(".")[0];
      const newName = nameMap[fileNameNoExt.toUpperCase()] || nameMap[fileName.toUpperCase()];

      if (newName) {
        const newNameUpperCase = newName.toUpperCase();

        if (!allFileNames.includes(newName) && !usedNewNames[newNameUpperCase]) {
          usedNewNames[newNameUpperCase] = newName;
          const fileExt = fileName.split(".")[1];

          await this.__fileSystem.moveFile(
            directoryName, fileName,
            directoryName, newName + (fileExt && !newNameUpperCase.endsWith("." + fileExt.toUpperCase()) ?
              "." + fileExt :
              "")
          );
        }
      }
    }, true);

    this.__toggleSpinner(false);
  },

  __validateFields: function () {
    if (!this.__curDir) {
      this.__showErrorMessage("You must select where the images are currently stored.");
      return false;
    } else if (!this.__csvData) {
      this.__showErrorMessage("The CSV file could not be read.");
      return false;
    }

    const oldFormat = this.__getOldNameFormat();
    const newFormat = this.__getNewNameFormat();

    if (!this.__nameFormat.isValidFormat(oldFormat)) {
      this.__showErrorMessage("You must enter a current file name format.");
      return false;
    } else if (!this.__nameFormat.isValidFormat(newFormat)) {
      this.__showErrorMessage("You must enter a new file name format.");
      return false;
    }

    return true;
  },

  __showErrorMessage: function (msg) {
    dialog.showErrorBox("Error", msg);
  },

  __toggleSpinner: function (show) {
    this.__$btnConvert.prop("disabled", show);
    this.__$spinner.toggle(show);
  }
};

$(document).ready(function () {
  new Index();
});
