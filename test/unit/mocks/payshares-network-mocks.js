'use strict';

angular.module('mockPaysharesNetwork', [])
  .factory('PaysharesNetwork', [function() {
    var transaction = {
      trustSet: function () {},
      setFlags: function () {},
      submit:   function () {},
      on:       function (event, callback) {
        if (event === 'success'){
          callback('ok')
        };
      }
    }
    var network = {
      remote: {
        transaction: function () {return transaction}
      }
    };
    return network
  }]);