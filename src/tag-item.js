'use strict';

/**
 * @ngdoc directive
 * @name tiTagItem
 * @module ngTagsInput
 *
 * @description
 * Represents a tag item. Used internally by the tagsInput directive.
 */
tagsInput.directive('tiTagItem', function(tiUtil, $window) {
    var singleCharWidth = 0;

  /**
   * Calculates the width of a single character (including space to next character). Assumes
   * we're using a monospaced font.
   *
   * @param element      Element to use for text width calculation.
   * @returns {number}   The width of a single character
   */
    function getCharWidth(element) {
        if (!singleCharWidth) {
            var span = angular.element('<span class="input"></span>');
            span.css('display', 'none')
              .css('visibility', 'hidden')
              .css('width', 'auto')
              .css('white-space', 'pre')
              .css('font-weight', 'bold');
            element.parent().append(span);
            span.text('00000000000000000000');
            span.css('display', '');
            singleCharWidth = span.prop('offsetWidth') / 20;
            span.css('display', 'none');
        }
        return singleCharWidth;
    }

    return {
        restrict: 'E',
        require: '^tagsInput',
        template: '<ng-include src="$$template"></ng-include>',
        scope: { data: '=' },
        link: function(scope, element, attrs, tagsInputCtrl) {
            var tagsInput = tagsInputCtrl.registerTagItem(),
                options = tagsInput.getOptions();

            scope.$$template = options.template;
            scope.$$removeTagSymbol = options.removeTagSymbol;

            scope.$getDisplayText = function() {
                var grandparent = element.parent().parent()[0];
                var availableWidth = grandparent.clientWidth;

                var txt = tiUtil.safeToString(scope.data[options.displayProperty]);

                // assuming that availableWidth==0 indicates a unit test, where we don't want to ellipsify
                if (availableWidth > 0) {
                    // 7 leaves enough room for both the ellipsis and the 'remove-tag' button at the end
                    if (txt.length > 8 && txt.length > availableWidth / getCharWidth(element)) {
                        txt = txt.substring(0, availableWidth / getCharWidth(element) - 8) + '...';
                    }
                }
                return txt;
            };

            scope.$getTagClass = function() {
                return tagsInputCtrl.getTagClass( { $tag: { text: scope.data[options.displayProperty] }} );
            };

            scope.$getTagStructure = function() {
                return tagsInputCtrl.getTagStructure( { $tag: { text: scope.$getDisplayText() }} );
            };

            scope.$removeTag = function() {
                tagsInput.removeTag(scope.$index, scope.data[options.displayProperty]);
            };

            scope.$watch('$parent.$index', function(value) {
                scope.$index = value;
            });

            angular.element($window).bind('resize', function () {
                scope.$apply();
            });
        }
    };
});
