'use strict';

/**
 * @ngdoc directive
 * @name tiTagItem
 * @module ngTagsInput
 *
 * @description
 * Represents a tag item. Used internally by the tagsInput directive.
 */
tagsInput.directive('tiTagItem', function(tiUtil) {
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
                return tiUtil.safeToString(scope.data[options.displayProperty]);
            };

            scope.$getTagClass = function() {
                return tagsInputCtrl.getTagClass( { $tag: { text: scope.$getDisplayText() }} );
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
        }
    };
});
