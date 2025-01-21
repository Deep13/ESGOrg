sap.ui.define([], function () {
  "use strict";
  var data = {
    "Direct economic value generated": "Revenues",
    "Direct economic value Distributed": "Operating costs, employee wages and benefits, payments to providers of capital, payments to government by country, and community investments",
    "Local Minimum Wage as Male": "Minimum compensation for employment per hour, or other unit of time, allowed under law, in circumstances in which different minimums can be used as a reference, report which minimum wage is being used",
    "Local Minimum Wage as Female": "Minimum compensation for employment per hour, or other unit of time, allowed under law, in circumstances in which different minimums can be used as a reference, report which minimum wage is being used",
    "Entry level wage for Male": "Entry level - wage full-time wage in the lowest employment category Note: Intern or apprentice wages are not considered entry level wages.",
    "Entry level wage for Female": "Entry level - wage full-time wage in the lowest employment category Note: Intern or apprentice wages are not considered entry level wages."
  };
  var isMulti = {
    "Markets served by the entity nationally": true,
    "Markets served by the entity internationally": true,
  }
  return {
    statusReminder: function (on, months) {
      var service = new Date(on);
      var a = new Date(service.setMonth(service.getMonth() + parseInt(months)));
      if (a.toDateString() == new Date().toDateString()) {
        return "Error";
      }
      return "Success";
    },
    expiryDate: function (on, months) {
      var service = new Date(on);
      var a = new Date(service.setMonth(service.getMonth() + parseInt(months)));
      return a.toDateString();
    },
    serviceOn: function (on) {
      return new Date(on).toDateString();
    },
    searchNotes: function (text) {
      return data[text];
    },
    showIcon: function (text) {
      return data[text] ? true : false;
    },
    toggleMultiInput: function (text) {
      return isMulti[text] ? true : false;
    }
  };
});
