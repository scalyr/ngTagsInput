'use strict';

/**
 * @ngdoc directive
 * @name tiAutosize
 * @module ngTagsInput
 *
 * @description
 * Automatically sets the input's width so its content is always visible. Used internally by tagsInput directive.
 */
tagsInput.directive('tiAutosize', function(tagsInputConfig, $window) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
            var threshold = tagsInputConfig.getTextAutosizeThreshold(),
                span, resize;

            span = angular.element('<span class="input"></span>');
            span.css('display', 'none')
                .css('visibility', 'hidden')
                .css('width', 'auto')
                .css('white-space', 'pre');

            element.parent().append(span);

            resize = function(originalValue) {
                var value = originalValue, width;

                if (angular.isString(value) && value.length === 0) {
                    value = attrs.placeholder;
                    if (angular.isString(value) && value.length === 0) {
                        value = '0';
                    }
                }

                if (value) {
                    span.text(value);
                    span.css('display', '');
                    width = span.prop('offsetWidth') + 4;  // the 4 is to address sizing finickyness on iOS
                    span.css('display', 'none');
                }

                var maxWidth = element.parent()[0].offsetWidth - 5;
                if (maxWidth < 10) {
                    maxWidth = 10;
                }
                var height = width/maxWidth;
                if (width > maxWidth) {
                    width = maxWidth;
                }
                element.css('width', width ? width + threshold + 'px' : '');
                if (height <1) {
                    element.css('height', '26px');
                } else {
                    element.css('height', Math.floor(2.2 + height) + 'em');
                }
                element.css('padding-top', '5px'); //TODO a bunch of hardcoded stuff here

                return originalValue;
            };

            ctrl.$parsers.unshift(resize);
            ctrl.$formatters.unshift(resize);

            attrs.$observe('placeholder', function(value) {
                if (!ctrl.$modelValue) {
                    resize(value);
                }
            });

            angular.element($window).bind('resize', function () {
                scope.$apply();
                resize(ctrl.$modelValue);
            });
        }
    };
});