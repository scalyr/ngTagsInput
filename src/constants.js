'use strict';

var KEYCODES = {
    backspace: 8,
    tab: 9,
    enter: 13,
    escape: 27,
    space: 32,
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    deleteKey: 46,
    keyA: 65
};

var CHARCODES = {
    comma: 44,
    semicolon: 59,
    contains: function(key) {
        return key === CHARCODES.comma ||
               key === CHARCODES.semicolon;
    }
};

var MAX_SAFE_INTEGER = 9007199254740991;
var SUPPORTED_INPUT_TYPES = ['text', 'email', 'url'];