'use strict';

/**
 * @ngdoc directive
 * @name tagsInput
 * @module ngTagsInput
 *
 * @description
 * Renders an input box with tag editing support.
 *
 * @param {string} ngModel Assignable Angular expression to data-bind to.
 * @param {string=} [template=NA] URL or id of a custom template for rendering each tag.
 * @param {string=} [displayProperty=text] Property to be rendered as the tag label.
 * @param {string=} [keyProperty=text] Property to be used as a unique identifier for the tag.
 * @param {string=} [type=text] Type of the input element. Only 'text', 'email' and 'url' are supported values.
 * @param {string=} [text=NA] Assignable Angular expression for data-binding to the element's text.
 * @param {number=} tabindex Tab order of the control.
 * @param {string=} [placeholder=Add a tag] Placeholder text for the control.
 * @param {number=} [minLength=3] Minimum length for a new tag.
 * @param {number=} [maxLength=MAX_SAFE_INTEGER] Maximum length allowed for a new tag.
 * @param {number=} [minTags=0] Sets minTags validation error key if the number of tags added is less than minTags.
 * @param {number=} [maxTags=MAX_SAFE_INTEGER] Sets maxTags validation error key if the number of tags added is greater
 *    than maxTags.
 * @param {boolean=} [allowLeftoverText=false] Sets leftoverText validation error key if there is any leftover text in
 *    the input element when the directive loses focus.
 * @param {string=} [removeTagSymbol=×] (Obsolete) Symbol character for the remove tag button.
 * @param {boolean=} [addOnEnter=true] Flag indicating that a new tag will be added on pressing the ENTER key.
 * @param {boolean=} [addOnSpace=false] Flag indicating that a new tag will be added on pressing the SPACE key.
 * @param {boolean=} [addOnComma=true] Flag indicating that a new tag will be added on pressing the COMMA key.
 * @param {boolean=} [addOnTab=true] Flag indicating that a new tag will be added on pressing the TAB key.
 * @param {boolean=} [addOnSemicolon=False] Flag indicating that a new tag will be added on pressing the SEMICOLON key.
 * @param {boolean=} [addOnBlur=true] Flag indicating that a new tag will be added when the input field loses focus.
 * @param {boolean=} [addOnPaste=false] Flag indicating that the text pasted into the input field will be split into tags.
 * @param {string=} [pasteSplitPattern=,] Regular expression used to split the pasted text into tags.
 * @param {boolean=} [replaceSpacesWithDashes=true] Flag indicating that spaces will be replaced with dashes.
 * @param {string=} [allowedTagsPattern=.+] Regular expression that determines whether a new tag is valid.
 * @param {boolean=} [enableEditingLastTag=false] Flag indicating that the last tag will be moved back into the new tag
 *    input box instead of being removed when the backspace key is pressed and the input box is empty.
 * @param {boolean=} [addFromAutocompleteOnly=false] Flag indicating that only tags coming from the autocomplete list
 *    will be allowed. When this flag is true, addOnEnter, addOnComma, addOnSpace and addOnBlur values are ignored.
 * @param {boolean=} [spellcheck=true] Flag indicating whether the browser's spellcheck is enabled for the input field or not.
 * @param {expression=} [onTagAdding=NA] Expression to evaluate that will be invoked before adding a new tag. The new
 *    tag is available as $tag. This method must return either true or false. If false, the tag will not be added.
 * @param {expression=} [onTagAdded=NA] Expression to evaluate upon adding a new tag. The new tag is available as $tag.
 * @param {expression=} [onInvalidTag=NA] Expression to evaluate when a tag is invalid. The invalid tag is available as $tag.
 * @param {expression=} [onTagRemoving=NA] Expression to evaluate that will be invoked before removing a tag. The tag
 *    is available as $tag. This method must return either true or false. If false, the tag will not be removed.
 * @param {expression=} [onTagRemoved=NA] Expression to evaluate upon removing an existing tag. The removed tag is
 *    available as $tag.
 * @param {expression=} [onTagClicked=NA] Expression to evaluate upon clicking an existing tag. The clicked tag is available as $tag.
 * @param {expression=} [getTagClass=NA] Determine a custom class for the tag (if any). The clicked tag is available as $tag.
 * @param {expression=} [getErrorMessage=NA] Determine error message for a tag (if any). The clicked tag is available as $tag.
 * @param {expression=} [getTagStructure=NA] Determine a custom class for the tag (if any). The clicked tag is available as $tag.
 * @param {expression=} [pasteSplitter=NA]
 * @param {expression=} [onEnterPressed=NA]
 */
tagsInput.directive('tagsInput', function($timeout, $document, $window, tagsInputConfig, tiUtil) {
    function TagList(options, events, onTagAdding, onTagRemoving) {
        var self = {}, getTagText, setTagText, tagIsValid;

        getTagText = function(tag) {
            return tiUtil.safeToString(tag[options.displayProperty]);
        };

        setTagText = function(tag, text) {
            tag[options.displayProperty] = text;
        };

        self.isCurrentlyEditing = function(tag) {
            var tagText = getTagText(tag);
            for (var i=0; i<self.items.length; i++) {
                if (self.items[i][options.displayProperty] === tagText) {
                    return self.editPosition === i;
                }
            }
            return false;
        };

        tagIsValid = function(tag) {
            var tagText = getTagText(tag);

            return tagText &&
                   tagText.length >= options.minLength &&
                   tagText.length <= options.maxLength &&
                   options.allowedTagsPattern.test(tagText) &&
                   (self.isCurrentlyEditing(tag) || !tiUtil.findInObjectArray(self.items, tag, options.keyProperty || options.displayProperty)) &&
                   onTagAdding({ $tag: tag });
        };

        self.editPosition = -1;
        self.items = [];

        self.preItems = function() {
            if (self.editPosition === -1) {
                return self.items;
            }
            return self.items.slice(0, self.editPosition);
        };

        self.postItems = function() {
            if (self.editPosition === -1) {
                return [];
            }
            return self.items.slice(self.editPosition + 1);
        };

        self.tagIsComplete = function(text) {
            return tagIsValid({'text': text});
        };

        self.addText = function(text) {
            var tag = {};
            setTagText(tag, text);
            return self.add(tag);
        };

        self.add = function(tag) {
            var tagText = getTagText(tag);

            if (options.replaceSpacesWithDashes) {
                tagText = tiUtil.replaceSpacesWithDashes(tagText);
            }

            setTagText(tag, tagText);

            if (tagIsValid(tag)) {
                if (self.editPosition !== -1) {
                    self.items.splice(self.editPosition, 1, tag);
                    self.editPosition = -1;
                } else {
                    self.items.push(tag);
                }
                events.trigger('tag-added', { $tag: tag });
            }
            else if (tagText) {
                events.trigger('invalid-tag', { $tag: tag });
            }

            return tag;
        };

        self.remove = function(index, text) {
            var tag = self.items[index];

            for (var i=0; i<self.items.length; i++) {
                if (self.items[i][options.displayProperty] === text) {
                    tag = self.items[i];
                    index = i;
                }
            }

            if (onTagRemoving({ $tag: tag }))  {
                if (index < self.editPosition) {
                    self.editPosition--;
                }

                self.items.splice(index, 1);
                self.clearSelection();
                events.trigger('tag-removed', { $tag: tag });
                return tag;
            }
        };

        self.select = function(index) {
            if (index < 0) {
                index = self.items.length - 1;
            }
            else if (index >= self.items.length) {
                index = 0;
            }

            self.index = index;
            self.selected = self.items[index];
        };

        self.selectPrior = function() {
            self.select(--self.index);
            return self.items[self.index];
        };

        self.selectNext = function() {
            self.select(++self.index);
            return self.items[self.index];
        };

        self.editSelected = function(tag) {
            for (var i=0; i<self.items.length; i++) {
                if (self.items[i] === tag) {
                    self.editPosition = i;
                    self.index = i;
                    return;
                }
            }
        };

        self.removeTagBeingEdited = function(shouldStartEditingPrevious) {
            var rv = null;
            if (self.editPosition >= -1) {
                rv = self.remove(self.editPosition);
            }
            if (self.editPosition > 0) {
                self.editSelected(self.items[self.editPosition]);
            }
            return rv;
        };

        self.removeSelected = function() {
            return self.remove(self.index);
        };

        self.clearSelection = function() {
            self.selected = null;
            self.index = -1;
        };

        self.clearSelection();

        return self;
    }

    function validateType(type) {
        return SUPPORTED_INPUT_TYPES.indexOf(type) !== -1;
    }

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            tags: '=ngModel',
            text: '=?',
            onTagAdding: '&',
            onTagAdded: '&',
            onInvalidTag: '&',
            onTagRemoving: '&',
            onTagRemoved: '&',
            onTagClicked: '&',
            getTagClass: '&',
            getTagStructure: '&',
            getErrorMessage: '&',
            pasteSplitter: '&',
            onEnterPressed: '&'
        },
        replace: false,
        transclude: true,
        templateUrl: 'ngTagsInput/tags-input.html',
        controller: function($scope, $attrs, $element) {
            $scope.events = tiUtil.simplePubSub();

            tagsInputConfig.load('tagsInput', $scope, $attrs, {
                template: [String, 'ngTagsInput/tag-item.html'],
                type: [String, 'text', validateType],
                placeholder: [String, ''],
                tabindex: [Number, null],
                removeTagSymbol: [String, String.fromCharCode(215)],
                replaceSpacesWithDashes: [Boolean, true],
                minLength: [Number, 3],
                maxLength: [Number, MAX_SAFE_INTEGER],
                addOnEnter: [Boolean, true],
                addOnSpace: [Boolean, false],
                addOnComma: [Boolean, true],
                addOnTab: [Boolean, false],
                addOnSemicolon: [Boolean, false],
                addOnBlur: [Boolean, true],
                addOnPaste: [Boolean, false],
                pasteSplitPattern: [RegExp, /,/],
                allowedTagsPattern: [RegExp, /.+/],
                enableEditingLastTag: [Boolean, false],
                minTags: [Number, 0],
                maxTags: [Number, MAX_SAFE_INTEGER],
                displayProperty: [String, 'text'],
                keyProperty: [String, ''],
                allowLeftoverText: [Boolean, false],
                addFromAutocompleteOnly: [Boolean, false],
                spellcheck: [Boolean, true]
            });

            $scope.tagList = new TagList($scope.options, $scope.events,
                tiUtil.handleUndefinedResult($scope.onTagAdding, true),
                tiUtil.handleUndefinedResult($scope.onTagRemoving, true));

            this.registerAutocomplete = function() {
                var input = $element.find('textarea');

                return {
                    addTag: function(tag) {
                        return $scope.tagList.add(tag);
                    },
                    focusInput: function() {
                        input[0].focus();
                    },
                    getTags: function() {
                        return $scope.tagList.items;
                    },
                    getCurrentTagText: function() {
                        return $scope.newTag.text();
                    },
                    getOptions: function() {
                        return $scope.options;
                    },
                    on: function(name, handler) {
                        $scope.events.on(name, handler);
                        return this;
                    }
                };
            };

            this.registerTagItem = function() {
                return {
                    getOptions: function() {
                        return $scope.options;
                    },
                    removeTag: function(index, text) {
                        if ($scope.disabled) {
                            return;
                        }
                        $scope.tagList.remove(index, text);
                    }
                };
            };

            this.getTagClass = $scope.getTagClass;
            this.getTagStructure = $scope.getTagStructure;
            this.getErrorMessage = $scope.getErrorMessage;
        },
        link: function(scope, element, attrs, ngModelCtrl) {
            var hotkeys = [KEYCODES.enter, KEYCODES.space, KEYCODES.backspace, KEYCODES.deleteKey, KEYCODES.left, KEYCODES.right, KEYCODES.tab],
                tagList = scope.tagList,
                events = scope.events,
                options = scope.options,
                input = element.find('textarea'),
                validationOptions = ['minTags', 'maxTags', 'allowLeftoverText'],
                setElementValidity;

            setElementValidity = function() {
                ngModelCtrl.$setValidity('maxTags', tagList.items.length <= options.maxTags);
                ngModelCtrl.$setValidity('minTags', tagList.items.length >= options.minTags);
                ngModelCtrl.$setValidity('leftoverText', scope.hasFocus || options.allowLeftoverText ? true : !scope.newTag.text());
            };

            ngModelCtrl.$isEmpty = function(value) {
                return !value || !value.length;
            };

            scope.newTag = {
                text: function(value) {
                    if (angular.isDefined(value)) {
                        scope.text = value;
                        events.trigger('input-change', value);
                    }
                    else {
                        return scope.text || '';
                    }
                },
                invalid: null
            };

            scope.track = function(tag) {
                return tag[options.keyProperty || options.displayProperty];
            };

            scope.$watch('tags', function(value) {
                if (value) {
                    tagList.items = tiUtil.makeObjectArray(value, options.displayProperty);
                    scope.tags = tagList.items;
                }
                else {
                    tagList.items = [];
                }
            });

            scope.$watch('tags.length', function() {
                setElementValidity();

                // ngModelController won't trigger validators when the model changes (because it's an array),
                // so we need to do it ourselves. Unfortunately this won't trigger any registered formatter.
                ngModelCtrl.$validate();
            });

            attrs.$observe('disabled', function(value) {
                scope.disabled = value;
            });

            scope.tagClass = function(tag) {
                if (scope.getTagClass) {
                    return scope.getTagClass({ $tag: tag });
                }
                return null;
            };

            scope.eventHandlers = {
                input: {
                    keydown: function($event) {
                        events.trigger('input-keydown', $event);
                    },
                    keypress: function($event) {
                        events.trigger('input-keypress', $event);
                    },
                    focus: function() {
                        if (scope.hasFocus) {
                            return;
                        }

                        scope.hasFocus = true;
                        events.trigger('input-focus');
                    },
                    blur: function() {
                        $timeout(function() {
                            var activeElement = $document.prop('activeElement'),
                                lostFocusToBrowserWindow = activeElement === input[0],
                                lostFocusToChildElement = element[0].contains(activeElement);

                            if (lostFocusToBrowserWindow || !lostFocusToChildElement) {
                                scope.hasFocus = false;
                                events.trigger('input-blur');
                            }
                        });
                    },
                    paste: function($event) {
                        $event.getTextData = function() {
                            var clipboardData = $event.clipboardData || ($event.originalEvent && $event.originalEvent.clipboardData);
                            return clipboardData ? clipboardData.getData('text/plain') : $window.clipboardData.getData('Text');
                        };
                        events.trigger('input-paste', $event);
                    }
                },
                host: {
                    clearInput: function() {
                        if (scope.disabled) {
                            return;
                        }

                        scope.tags = [];

                        $timeout(function() {
                            input[0].focus();
                        });
                    },
                    // TODO fix DRY here
                    mousedown: function(event) {
                        if (scope.disabled) {
                            return;
                        }

                        if (angular.element(event.target).hasClass('tags')) {
                            $timeout(function() {
                                if (tagList.editPosition !== -1) {
                                    if (options.addOnBlur && !options.addFromAutocompleteOnly) {
                                        tagList.addText(scope.newTag.text());
                                    }
                                }
                                input[0].focus();
                            });
                        }
                    },
                    click: function(event) {
                        if (scope.disabled) {
                            return;
                        }
                        if (angular.element(event.target).hasClass('tags')) {
                            $timeout(function() {
                                if (angular.element(event.target).hasClass('tags') && tagList.editPosition !== -1) {
                                    if (options.addOnBlur && !options.addFromAutocompleteOnly) {
                                        tagList.addText(scope.newTag.text());
                                    }
                                }
                                input[0].focus();
                            });
                        }
                    }
                },
                tag: {
                    // TODO fix DRY here
                    mousedown: function(event, tag) {
                        // let clicks on the remove button go through
                        if (angular.element(event.target).hasClass('remove-button')) {
                            return;
                        }

                        event.preventDefault();
                        event.stopPropagation();

                        if (options.addOnBlur && !options.addFromAutocompleteOnly) {
                            tagList.addText(scope.newTag.text());
                        }
//                        element.triggerHandler('blur');
                        setElementValidity();

                        events.trigger('tag-clicked', { $tag: tag });

                        if (tag) {
                            tagList.editSelected(tag);
                            scope.newTag.text(tag[options.displayProperty]);
                            $timeout(function() {
                                input[0].focus();
                            });
                        }
                    },
                    click: function(event, tag) {
                        event.preventDefault();
                        event.stopPropagation();

                        if (options.addOnBlur && !options.addFromAutocompleteOnly) {
                            tagList.addText(scope.newTag.text());
                        }
//                        element.triggerHandler('blur');
                        setElementValidity();

                        events.trigger('tag-clicked', { $tag: tag });

                        if (tag) {
                            tagList.editSelected(tag);
                            scope.newTag.text(tag[options.displayProperty]);
                            $timeout(function() {
                                input[0].focus();
                            });
                        }
                    }
                }
            };

            function isEmpty() {
                return scope.newTag.text().length === 0;
            }

            function inQuotedString() {
                var txt = scope.newTag.text().replace(/\\'/g, '"');
                return (txt.match(/'/g)||[]).length % 2;
            }

            function addText(event, text, pasting) {
                var tags = [];
                if (scope.pasteSplitter()) {
                    tags = scope.pasteSplitter()(text);
                }

                if (!tags || tags.length === 0) {
                    if (pasting) {
                        tags = text.split(options.pasteSplitPattern);
                    } else {
                        tags = [text];
                    }
                }

                if ((pasting && tags.length >= 2) || (!pasting)) {
                    tags.forEach(function(tag) {
                        tagList.addText(tag);
                    });
                    event.preventDefault();
                }
            }

            function removeTagBeingEdited(shouldStartEditingPrecedingTag) {
                tagList.removeTagBeingEdited(shouldStartEditingPrecedingTag);
            }


            function handleKeyEvent(event, key, shouldAdd, shouldEditLastTag, shouldRemove, shouldSelect) {
                if (shouldAdd) {
                    addText(event, scope.newTag.text(), false);

                    if (scope.onEnterPressed() && event.keyCode === KEYCODES.enter) {
                        scope.onEnterPressed()();
                    }
                }
                else if (shouldEditLastTag) {
                    var tag;

                    tag = tagList.selectPrior();

                    if (tag) {
                        tagList.editSelected(tag);
                        scope.newTag.text(tag[options.displayProperty]);
                        $timeout(function() {
                            input[0].focus();
                        });
                    }
                }
                else if (shouldRemove) {
                    tagList.removeSelected();
                }
                else if (shouldSelect) {
                    if (key === KEYCODES.left || key === KEYCODES.backspace) {
                        tagList.selectPrior();
                    }
                    else if (key === KEYCODES.right) {
                        tagList.selectNext();
                    }
                }

                if (shouldAdd || shouldSelect || shouldRemove || shouldEditLastTag) {
                    event.preventDefault();
                }
            }

            events
                .on('tag-added', scope.onTagAdded)
                .on('invalid-tag', scope.onInvalidTag)
                .on('tag-removed', scope.onTagRemoved)
                .on('tag-clicked', scope.onTagClicked)
                .on('tag-added', function() {
                    scope.newTag.text('');
                })
                .on('tag-added tag-removed', function() {
                    scope.tags = tagList.items;
                    // Ideally we should be able call $setViewValue here and let it in turn call $setDirty and $validate
                    // automatically, but since the model is an array, $setViewValue does nothing and it's up to us to do it.
                    // Unfortunately this won't trigger any registered $parser and there's no safe way to do it.
                    ngModelCtrl.$setDirty();
                })
                .on('invalid-tag', function() {
                    scope.newTag.invalid = true;
                })
                .on('option-change', function(e) {
                    if (validationOptions.indexOf(e.name) !== -1) {
                        setElementValidity();
                    }
                })
                .on('input-change', function() {
                    tagList.clearSelection();
                    scope.newTag.invalid = null;
                })
                .on('input-focus', function() {
                    element.triggerHandler('focus');
                    ngModelCtrl.$setValidity('leftoverText', true);
                })
                .on('input-blur', function() {
                    if (options.addOnBlur && !options.addFromAutocompleteOnly) {
                        tagList.addText(scope.newTag.text());
                    }
                    element.triggerHandler('blur');
                    setElementValidity();
                })
                .on('input-keydown', function(event) {
                    var key = event.keyCode,
                        addKeys = {},
                        shouldAdd, shouldRemove, shouldSelect, shouldEditLastTag;

                    if (tiUtil.isModifierOn(event) || hotkeys.indexOf(key) === -1) {
                        return;
                    }

                    addKeys[KEYCODES.enter] = options.addOnEnter && !isEmpty();
                    addKeys[KEYCODES.space] = options.addOnSpace;
                    addKeys[KEYCODES.tab] = options.addOnTab && !isEmpty();

                    shouldAdd = !options.addFromAutocompleteOnly && addKeys[key];
                    shouldRemove = (key === KEYCODES.backspace || key === KEYCODES.deleteKey) && tagList.selected;
                    shouldEditLastTag = key === KEYCODES.backspace && isEmpty() && options.enableEditingLastTag;
                    shouldSelect = (key === KEYCODES.backspace || key === KEYCODES.left || key === KEYCODES.right) && isEmpty() && !options.enableEditingLastTag;

                    if ((key === KEYCODES.backspace || KEYCODES.deleteKey === key) && isEmpty() && tagList.editPosition !== -1) {
                        event.preventDefault();
                        removeTagBeingEdited(true);
                    }

                    if (key === KEYCODES.enter && isEmpty()) {
                        removeTagBeingEdited();
                        event.preventDefault();
                    } else {
                        handleKeyEvent(event, key, shouldAdd, shouldEditLastTag, shouldRemove, shouldSelect);
                    }
                })
                .on('input-keypress', function(event) {
                    var key = event.charCode,
                        shouldAdd = false;

                    if (!tiUtil.isModifierOn(event)) {
                        var text = scope.newTag.text();
                        shouldAdd |= options.addOnComma && key === CHARCODES.comma;
                        shouldAdd |= options.addOnSemicolon && key === CHARCODES.semicolon;
                        shouldAdd &= !options.addFromAutocompleteOnly;
                        if (shouldAdd && tagList.tagIsComplete(text)) {
                            addText(event, text, false);
                        }
                    }
                })
                .on('input-paste', function(event) {
                    if (options.addOnPaste) {
                        var text = event.getTextData();
                        addText(event, text, true);
                    }
                });
        }
    };
});
