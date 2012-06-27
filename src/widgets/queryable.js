define([
    'vendor/jquery',
    'vendor/underscore'
], function ($, _) {
    var remove = function(array, obj) {
        var idx = _.indexOf(array, obj);
        if (idx >= -1) {
            array.splice(idx, 1);
        }
    };

    return {
        executeQuery: function(dfd) {
            var self = this;

            dfd = dfd.pipe(

                //Filter Success
                function(value) {
                    if(dfd !== _.last(self._currentDfds)) {
                        remove(self._currentDfds, dfd);
                        return $.Deferred().reject();
                    }
                    // self._currentDfds.length = 0;
                    remove(self._currentDfds, dfd);
                    return this.resolve();
                },

                //Filter Failure
                function(value) {
                    remove(self._currentDfds, dfd);
                    return $.Deferred().reject(value);
                }
            );

            (self._currentDfds = self._currentDfds || []).push(dfd);
            return dfd;
        }
    };
});