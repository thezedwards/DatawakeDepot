'use strict';
var app = angular.module('com.module.dwDomains');

app.service('DomainsService', ['$state', 'CoreService', 'DwDomain','gettextCatalog','DwDomainEntityType','DwDomainItem', function($state, CoreService, DwDomain, gettextCatalog, DwDomainEntityType, DwDomainItem) {

    this.getDomains = function() {
        return DwDomain.find({filter: {include: ['domainEntityTypes','domainItems','extractors','trails','feeds','teams']}});
    };

    this.getDomain = function(id) {
        return DwDomain.findById({
            id: id
        });
    };

    this.upsertDomain = function(domain, cb) {
        DwDomain.upsert(domain, function(newDomain) {
            CoreService.toastSuccess(gettextCatalog.getString('Domain saved'), gettextCatalog.getString('Your domain is safe with us!'));

            //TODO: We must first remove all linked items before adding them, otherwise we can't account for removed links

            //For Many-To-Many relationships you MUST manually link the two models for INCLUDE to work in relationships
            if(domain.dwTeams) {
                domain.dwTeams.forEach(function (team) {
                    DwDomain.teams.link({id: newDomain.id, fk: team}, null, function (value, header) {
                        //success
                    });
                });
            };

            if(domain.dwFeeds) {
                domain.dwFeeds.forEach(function (feed) {
                    DwDomain.feeds.link({id: newDomain.id, fk: feed}, null, function (value, header) {
                        //success
                    });
                });
            };

            if(domain.dwExtractors) {
                domain.dwExtractors.forEach(function (extractor) {
                    DwDomain.extractors.link({id: newDomain.id, fk: extractor}, null, function (value, header) {
                        //success
                    });
                });
            };
            //For other relationships you MUST manually add the items
            if(domain.domainEntityTypes) {
                domain.domainEntityTypes.forEach(function (det) {
                    DwDomainEntityType.upsert(det, function() {
                        //success
                    }, function(err) {
                    });
                });
            };

            if(domain.domainItems) {
                domain.domainItems.forEach(function (di) {
                DwDomainItem.upsert(di, function() {
                        //success
                    }, function(err) {

                    });
                });
            };

            cb();
        }, function(err) {
            CoreService.toastSuccess(gettextCatalog.getString(
                'Error saving domain '), gettextCatalog.getString(
                    'This domain could no be saved: ') + err);
        });

    };

    this.deleteDomain = function(domain, cb) {
        CoreService.confirm(gettextCatalog.getString('Are you sure?'),
            gettextCatalog.getString('Deleting this cannot be undone'),
            function() {
                //For Many-To-Many relationships you MUST manually unlink the entities before deleting the domain
                if(domain.id.dwTeams) {
                    domain.id.dwTeams.forEach(function (team) {
                        DwDomain.teams.unlink({id: domain.id, fk: team}, null, function (value, header) {
                            //success
                        });
                    });
                };

                if(domain.id.dwFeeds) {
                    domain.id.dwFeeds.forEach(function (feed) {
                        DwDomain.feeds.unlink({id: domain.id, fk: feed}, null, function (value, header) {
                            //success
                        });
                    });
                };

                if(domain.id.dwExtractors) {
                    domain.id.dwExtractors.forEach(function (extractor) {
                        DwDomain.extractors.unlink({id: domain.id, fk: extractor}, null, function (value, header) {
                            //success
                        });
                    });
                };

                //Now delete the domain
                DwDomain.deleteById(domain.id, function() {
                    CoreService.toastSuccess(gettextCatalog.getString('Domain deleted'), gettextCatalog.getString('Your domain is deleted!'));

                    //For other relationships you MUST manually remove the child items
                    if(domain.id.domainItems) {
                        domain.id.domainItems.forEach(function (di) {
                            DwDomainItem.delete(di, function() {
                                //success
                            }, function(err) {
                            });
                        });
                    };

                    if(domain.id.domainEntityTypes) {
                        domain.id.domainEntityTypes.forEach(function (det) {
                            DwDomainEntityType.delete(det, function() {
                                //success
                            }, function(err) {
                            });
                        });
                    };

                    cb();
                }, function(err) {
                    CoreService.toastError(gettextCatalog.getString(
                        'Error deleting domain'), gettextCatalog.getString(
                            'Your domain is not deleted! ') + err);
                });
            },
            function() {
                return false;
            });
    };

}]);
