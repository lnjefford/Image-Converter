NameFormat = function () {
  this.__$tmplFormat = $("#tmplFormat");
  this.__$tmplFormatPiece = $("#tmplFormatPiece");

  this.__addHandlers();
}

NameFormat.prototype = {
  getFormatControlHTML: function () {
    return this.__$tmplFormat.html();
  },

  updateFormatOptions: function (options) {
    this.__currentOptions = options;

    const $colSelections = $(".colSelection");
    for (const elSelect of $colSelections) {
      const $select = $(elSelect);
      const curSelection = $select.val();

      this.__setOptionsInSelect($select, this.__currentOptions);
      $select.val(curSelection);
    }
  },

  getFormatFromControl: function ($formatControl) {
    const $children = $formatControl.children();
    const format = [];

    for (const childEl of $children) {
      const $child = $(childEl);

      if ($child.is("select")) {
        const selectedIndex = parseInt($child.prop("selectedIndex"));
        if (selectedIndex > 0) {
          format.push(selectedIndex - 1);
        }
      } else if ($child.is("input")) {
        format.push($child.val());
      }
    }

    return format;
  },

  isValidFormat: function (format) {
    for (const piece of format) {
      if (piece !== "") {
        return true;
      }
    }

    return false;
  },

  getOldNameToNewNameMap: function (csvData, oldFormat, newFormat) {
    const nameMap = {};

    for (const csvRow of csvData) {
      const oldName = this.__buildNameFromFormat(csvRow, oldFormat);
      const newName = this.__buildNameFromFormat(csvRow, newFormat);
      nameMap[oldName.toUpperCase()] = newName;
    }

    return nameMap;
  },

  __addHandlers: function () {
    $("body").on("click", ".addFormat", $.proxy(this.__addPieceToFormat, this));
  },

  __addPieceToFormat: function (e) {
    $(e.target).before(this.__$tmplFormatPiece.html());
    this.updateFormatOptions(this.__currentOptions);
  },

  __setOptionsInSelect: function ($select, options) {
    $select.empty();

    if (options) {
      for (const option of options) {
        $select.append("<option value='" + option + "'>" + option + "</option>");
      }
    }
  },

  __isInt: function (check) {
    return (typeof check === 'number' && (check%1) === 0);
  },

  __buildNameFromFormat: function (rowData, format) {
    var name = "";

    for (const piece of format) {
      if (this.__isInt(piece)) {
        name += rowData[piece];
      } else {
        name += piece;
      }
    }

    return name;
  },
}
