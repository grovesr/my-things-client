// globals
var nodesViewModel = null;
var addMainNodeModel = null;
var addSubNodeModel = null;
var editMainNodeModel = null;
var editSubNodeModel = null;
var editItemNodeModel = null;
var addTypeModel = null;
var loginModel = null;
var secrets = null;
var app = null;
var lastAjaxError = '';
var defaultAlert = '';
var defaultRequestTimeout = 12000;
var alertIds = {'main':'#alertBox',
                'login':'#loginAlertBox',
                'editItemNode':'#editItemNodeAlertBox'}
$('#accordianMain i.fa, #accordianMain i.far').css({'visibility':'hidden'});
$('.mt-add-buttons, .mt-edit-buttons, .mt-item-form, .nav-item, .nav-link').css({'visibility':'hidden'});
$('#itemSortIndex').addClass("d-none");

function setDefaultAlert() {
  var alerts = $('.alert');
  Object.keys(alerts).forEach(function(indx) {
    setAlert(nodesViewModel.defaultAlert(),'','#'+alerts[indx].id);
  });
}

function setAlert(alertText='', alertClass = '', alertId=alertIds.main) {
  $('html').off('click', setDefaultAlert);
  if(alertClass !== '') {
    $('html').on('click', setDefaultAlert);
  }
  if(alertText === '') {
    alertText = '&nbsp;';
    $(alertId).css({'visibility':'hidden'});
  } else {
    $(alertId).css({'visibility':'visible'});
  }
   $(alertId).empty();
   $(alertId).removeClass (function (index, className) {
     return (className.match (/(^|\s)alert-\S+/g) || []).join(' ');
   });
   if( alertClass.length > 0) {
       $(alertId).addClass(alertClass);
   } else {
     $(alertId).addClass('alert-dark');
   };
   $(alertId).append('<span id="alertText"></span>');
   $(alertId + ' #alertText').html(alertText);
   if(alertClass !== "") {
     $(alertId).append(
       '<button type="button" class="close" aria-label="Close">' +
          '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '<span id="alertText"></span>'
      );
     $(alertId + ' button.close').on('click', function () {
         $(alertId).empty();
         $(alertId).removeClass (function (index, className) {
           return (className.match (/(^|\s)alert-\S+/g) || []).join(' ');
         });
         $(alertId).addClass('alert-dark');
         $(alertId).append(nodesViewModel.defaultAlert());
     })
   }
}

var ListNode = function(node=new Node()) {
  var self = this;
  self.type = ko.observable(node.type());
  self.name = ko.observable(node.name());
  self.id = ko.observable(node.id());
  self.dateTried = ko.observable(node.dateTried());
  self.description = ko.observable(node.description());
  self.averageRating = ko.observable(node.averageRating());
}

var Node = function(initialize=true, data={}, aspects={}) {
  var self = this;
  if(initialize) {
    self.children = ko.observableArray([]);
self.collapsed = ko.observable(true);
    self.visible = ko.observable(true);
  }
  self.forgettableAspects = ['children', 'collapsed', 'forgettableAspects',
                             'changed', 'nodeTooltip', 'nodeviewTooltip',
                             'nodeReviewTooltip','leavesNeeded'];
  if(Object.keys(data).length) {
    if(Object.keys(aspects).length) {
      //self.loadData(data);
      self.loadDataWithAspects(data, aspects);
    } else {
      self.loadData(data);
    }
  }

  if(initialize) {
    self.nodeDescriptionTooltip = ko.pureComputed(function() {
      return (self.description() ? self.description() : '');
    });
    self.nodeReviewTooltip = ko.pureComputed(function() {
      return (self.review() ? self.review() : '');
    });
    self.image = ko.computed(function() {
      var image = '';
      if(nodesViewModel.type() === 'books') {
        image = 'images/book.jpeg';
      } else if(nodesViewModel.type() === 'beer') {
        image = "images/beer.png";
      } else if(nodesViewModel.type() === 'wine') {
        image = "images/wine.png";
      } else if(nodesViewModel.type() === 'spirits') {
        image = "images/spirits.png";
      } else if(nodesViewModel.type() === 'campgrounds') {
        image = "images/camping.png";
      } else if(nodesViewModel.type() === 'tv') {
        image = "images/tv.png";
      }
      return image;
    });
  }
}

Node.prototype.slug = function() {
  var self = this;
  var trimmed = $.trim(self.name());
  return trimmed;
}

Node.prototype.toggleNeed = function() {
  var self = this;
  self.need(!self.need());
  return self.need();
}

Node.prototype.setDateTried = function() {
  var self = this;
  if(self.haveTried() && !self.dateTried()) {
    var date = new Date();
    self.dateTried((date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear());
  }
  if(!self.haveTried()) {
    self.dateTried(null);
  }
}

Node.prototype.setDateReviewed = function() {
  var self = this;
  if(self.review() && !self.dateReviewed()) {
    var date = new Date();
    self.dateReviewed((date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear());
  }
}

Node.prototype.loadData = function(data) {
  var self = this;
  Object.keys(data).forEach(function(aspect) {
    // dynamically set the Node's aspects based on the JSON data
    if(data[aspect] && typeof data[aspect] === 'object') {
      self[aspect] = ko.observable({});
      Object.keys(data[aspect]).forEach( function(nodeInfoAspect) {
        if(typeof data[aspect][nodeInfoAspect] === 'array') {
          self[aspect]()[nodeInfoAspect] = ko.observableArray(data[aspect][nodeInfoAspect]);
        }else {
          self[aspect]()[nodeInfoAspect] = ko.observable(data[aspect][nodeInfoAspect]);
          if(nodeInfoAspect === 'ISBN_13' && data[aspect]) {
            self[aspect]()['ISBN'] = ko.observable(data[aspect][nodeInfoAspect]);
          } else if(nodeInfoAspect === 'ISBN_10' && data[aspect]) {
            self[aspect]()['ISBN'] = ko.observable(data[aspect][nodeInfoAspect]);
          }
        }
      })
    } else {
      self[aspect] = ko.observable(data[aspect]);
    }
  })
}

Node.prototype.loadDataWithAspects = function(data, aspects) {
  var self = this;
  if(!data.nodeInfo) {
    data.nodeInfo = {};
  }
  self['nodeInfo'] = ko.observable({});
  // Only set aspects based on the passed in aspects dictionary
  if(data['nodeInfo'] && typeof data['nodeInfo'] === 'object') {
    aspects['nodeInfo'].forEach(function(nodeInfoAspect) {
      if(typeof data['nodeInfo'][nodeInfoAspect] === 'array') {
        self['nodeInfo']()[nodeInfoAspect] = ko.observableArray(data['nodeInfo'][nodeInfoAspect]);
      }else {
        self['nodeInfo']()[nodeInfoAspect] = ko.observable(data['nodeInfo'][nodeInfoAspect]);
        if(nodeInfoAspect === 'ISBN_13' && data['nodeInfo']) {
          self['nodeInfo']()['ISBN'] = ko.observable(data['nodeInfo'][nodeInfoAspect]);
        } else if(nodeInfoAspect === 'ISBN_10' && data[aspect]) {
          self['nodeInfo']()['ISBN'] = ko.observable(data['nodeInfo'][nodeInfoAspect]);
        }
      }
    })
  }
  aspects['required'].forEach(function(requiredAspect) {
    self[requiredAspect] = ko.observable(data[requiredAspect]);
  })
  if(self.hasOwnProperty('id') === false) {
    console.log('no id property');
  }
}

Node.prototype.updateData = function(data) {
  var self = this;
  Object.keys(data).forEach(function(aspect) {
    // dynamically set the Node's aspects based on the passed in data
    if(data[aspect] && typeof data[aspect] === 'object') {
      Object.keys(data[aspect]).forEach( function(nodeInfoAspect) {
        if(!ko.isComputed(self[aspect]()[nodeInfoAspect])) {
          self[aspect]()[nodeInfoAspect](data[aspect][nodeInfoAspect]);
        }
      })
    } else {
      if(!ko.isComputed(self[aspect])) {
        self[aspect](data[aspect]);
      }
    }
  })
}

Node.prototype.updateNodeInfoData = function(data) {
  var self = this;
  Object.keys(data).forEach(function(aspect) {
    // dynamically set the Node's aspects based on the JSON data
    if(aspect === 'description' || aspect === 'name') {
      self[aspect](data[aspect]);
    } else {
      self.nodeInfo()[aspect](data[aspect]);
    }
  })
}

Node.prototype.sanitize = function() {
  var self = this;
  var sanitizedNode = new Node(false);
  sanitizedNode.forgettableAspects = sanitizedNode.forgettableAspects.concat(['ownerId', 'parentId']);
  Object.keys(self).forEach(function(aspect) {
    if(sanitizedNode.forgettableAspects.indexOf(aspect) === -1) {
      sanitizedNode[aspect] = self[aspect];
    }
  });
  return sanitizedNode;
}

Node.prototype.copy = function() {
  var self = this;
  var nodeCopy = new Node();
  Object.keys(self).forEach(function(aspect) {
    if(self.forgettableAspects.indexOf(aspect) === -1) {
      if( self[aspect]() && typeof self[aspect]() === 'object') {
        nodeCopy[aspect] = ko.observable({});
        Object.keys(self[aspect]()).forEach( function(nodeInfoAspect) {
          nodeCopy[aspect]()[nodeInfoAspect]=ko.observable((self[aspect]()[nodeInfoAspect]()));
        })
      } else {
        nodeCopy[aspect]=ko.observable(self[aspect]());
      }
    }
  });
  return nodeCopy;
}

Node.prototype.data = function() {
  var self = this;
  var nodeData = {};
  Object.keys(self).forEach(function(aspect) {
    if(self.forgettableAspects.indexOf(aspect) === -1) {
      if(self[aspect]()!== null && typeof self[aspect]() === 'object') {
        nodeData[aspect] = {};
        Object.keys(self[aspect]()).forEach( function(nodeInfoAspect) {
          nodeData[aspect][nodeInfoAspect] = self[aspect]()[nodeInfoAspect]();
        });
      } else {
        nodeData[aspect]=self[aspect]();
      }
    }
  });
  return nodeData;
}

Node.prototype.nonNullData = function() {
  var self = this;
  var nodeData = {};
  Object.keys(self).forEach(function(aspect) {
    if(self.forgettableAspects.indexOf(aspect) === -1) {
      if(self[aspect]()!== null && typeof self[aspect]() === 'object') {
        nodeData[aspect] = {};
        Object.keys(self[aspect]()).forEach( function(nodeInfoAspect) {
          if(self[aspect]()[nodeInfoAspect]()) {
            nodeData[aspect][nodeInfoAspect] = self[aspect]()[nodeInfoAspect]();
          }
        });
      } else {
        if(self[aspect]()) {
          nodeData[aspect]=self[aspect]();
        }
      }
    }
  });
  return nodeData;
}

var NodesViewModel = function() {
  var self = this;
  self.context = null;
  self.visible = ko.observable(false);
  self.filterPage = ko.observable(null);
  self.filterPages = ko.observable(null);
  self.filterPerPage = ko.observable(20);
  self.filterNextPage  = ko.observable(null);
  self.filterPrevPage = ko.observable(null);
  self.filterTotalItems = ko.observable(0);
  self.sortPage = ko.observable(null);
  self.sortPages = ko.observable(null);
  self.sortPerPage = ko.observable(20);
  self.sortNextPage  = ko.observable(null);
  self.sortPrevPage = ko.observable(null);
  self.sortTotalItems = ko.observable(null);
  self.mainLabels = {'books':'Author',
                    'wine':'Winery',
                    'beer':'Brewery',
                    'spirits':'Distillery',
                    'campgrounds':'State',
                    'videos':'Genre',
                    'other':'Main'};
  self.subLabels = {'books':'Series',
                    'wine':'Type',
                    'beer':'Type',
                    'spirits':'Type',
                    'campgrounds':'Region',
                    'videos':'Series Name/non-series',
                    'other':'Sub'};
  self.itemLabels = {'books':'Book',
                    'wine':'Wine',
                    'beer':'Beer',
                    'spirits':'Spirit',
                    'campgrounds':'Campground',
                    'videos':'Season #/Title',
                    'other':'Item'};
  self.triedLabels = {'books':'Read',
                    'wine':'Tried',
                    'beer':'Tried',
                    'spirits':'Tried',
                    'campgrounds':'Camped',
                    'videos':'Viewed',
                    'other':'Tried'};
  self.sortIndexLabels = {'books':'Series Order',
                         'wine':'n/a',
                         'beer':'n/a',
                         'spirits':'n/a',
                         'campgrounds':'n/a',
                         'videos':'Series Order',
                         'other':'Sort Index'};
  self.nodeInfo1Keys = {'books':'publisher',
                        'wine':'vintage',
                        'beer':'vintage',
                        'spirits':'vintage',
                        'campgrounds':'type',
                        'videos':'provider',
                        'other':'nodeinfo1'};
  self.nodeInfo2Keys = {'books':'publishedDate',
                        'wine':'region',
                        'beer':'region',
                        'spirits':'region',
                        'campgrounds':'dates',
                        'videos':'aired',
                        'other':'nodeinfo2'};
  self.nodeInfo3Keys = {'books':'pageCount',
                        'wine':'ABV',
                        'beer':'ABV',
                        'spirits':'ABV',
                        'campgrounds':'amenities',
                        'videos':'epsiodes',
                        'other':'nodeinfo3'};
  self.nodeInfo4Keys = {'books':'ISBN',
                        'wine':'taste',
                        'beer':'IBU',
                        'spirits':'taste',
                        'campgrounds':'sites',
                        'videos':'length',
                        'other':'nodeinfo4'};
  self.nodeInfo5Keys = {'books':'ASIN',
                        'wine':'color',
                        'beer':'SRM',
                        'spirits':'color',
                        'campgrounds':'cost',
                        'videos':'actors',
                        'other':'nodeinfo5'};
  self.nodeInfo6Keys = {'books':'googleLink',
                        'wine':'link',
                        'beer':'link',
                        'spirits':'link',
                        'campgrounds':'link',
                        'videos':'link',
                        'other':'nodeinfo6'};
  self.nodeInfo1Labels = {'books':'Publisher',
                        'wine':'Vintage',
                        'beer':'Vintage',
                        'spirits':'Vintage',
                        'campgrounds':'Type',
                        'videos':'Provider',
                        'other':'Node Info 1'};
  self.nodeInfo2Labels = {'books':'Published',
                        'wine':'Region',
                        'beer':'Region',
                        'spirits':'Region',
                        'campgrounds':'Dates Open',
                        'videos':'First Aired',
                        'other':'Node Info 2'};
  self.nodeInfo3Labels = {'books':'Pages',
                        'wine':'ABV',
                        'beer':'ABV',
                        'spirits':'ABV',
                        'campgrounds':'Amenities',
                        'videos':'# Episodes',
                        'other':'Node Info 3'};
  self.nodeInfo4Labels = {'books':'ISBN',
                        'wine':'Taste',
                        'beer':'IBU',
                        'spirits':'Taste',
                        'campgrounds':'Site details',
                        'videos':'Avg. Length',
                        'other':'Node Info 4'};
  self.nodeInfo5Labels = {'books':'ASIN',
                        'wine':'Color',
                        'beer':'SRM',
                        'spirits':'Color',
                        'campgrounds':'Cost',
                        'videos':'Actors',
                        'other':'Node Info 5'};
  self.nodeInfo6Labels = {'books':'Link',
                        'wine':'Link',
                        'beer':'Link',
                        'spirits':'Link',
                        'campgrounds':'Link',
                        'videos':'Link',
                        'other':'Node Info 6'};
  self.requiredAspects = ['id',
                          'ownerId',
                          'type',
                          'need',
                          'sortIndex',
                          'parentId',
                          'haveTried',
                          'dateTried',
                          'dateReviewed',
                          'rating',
                          'name',
                          'description',
                          'review',
                          'uri'];
  self.defaultGoogleIcon = 'G';
  self.defaultItemSaveIcon = 'Save';
  self.defaultItemDeleteIcon = 'Delete';
  self.defaultItemEditIcon = 'Edit'
  self.defaultSpinnerIcon = '<i class="fa fa-spinner fa-spin"></i>';
  self.fillItemFromGoogleIcon = ko.observable(self.defaultGoogleIcon);
  self.itemSaveIcon = ko.observable(self.defaultItemSaveIcon);
  self.itemDeleteIcon = ko.observable(self.defaultItemDeleteIcon);
  self.itemEditIcon = ko.observable(self.defaultItemEditIcon);
  self.defaultAlert = ko.observable(defaultAlert);
  self.currentUser = ko.observable();
  self.currentUserId = null;
  self.loggedIn = ko.observable(false);
  self.currentUserPassword = null;
  self.authHeader = null;
  self.previousUser = null;
  self.previousUserPassword = null;
  self.type = ko.observable('books');
  self.types = ko.observableArray([
    'books',
    'beer',
    'wine',
    'spirits',
    'campgrounds',
    'videos',
    'other']);
  self.mainLabel = ko.observable();
  self.subLabel = ko.observable();
  self.itemLabel = ko.observable();
  self.triedLabel = ko.observable();
  self.sortIndexLabel = ko.observable();
  self.nodeInfo1Key = ko.observable();
  self.nodeInfo2Key = ko.observable();
  self.nodeInfo3Key = ko.observable();
  self.nodeInfo4Key = ko.observable();
  self.nodeInfo5Key = ko.observable();
  self.nodeInfo6Key = ko.observable();
  self.nodeInfo1Label = ko.observable();
  self.nodeInfo2Label = ko.observable();
  self.nodeInfo3Label = ko.observable();
  self.nodeInfo4Label = ko.observable();
  self.nodeInfo5Label = ko.observable();
  self.nodeInfo6Label = ko.observable();
  self.mainNodes = ko.observableArray();
  self.selectedMainNode = ko.observable(null);
  self.selectedSubNode = ko.observable(null);
  self.selectedItem = ko.observable(null);
  self.filterText = ko.observable('');
  self.filterItems = ko.observableArray([]);
  self.sortedItems = ko.observableArray([]);
  self.previousSelectedItem = null;
  self.rootNode = null;
  self.adjacencyList = {};
  self.nodeInfoKeys = ko.pureComputed(function() {
    return [self.nodeInfo1Key(),
            self.nodeInfo2Key(),
            self.nodeInfo3Key(),
            self.nodeInfo4Key(),
            self.nodeInfo5Key(),
            self.nodeInfo6Key(),
            'numberSubs',
            'averageLeafRating',
            'needLeaves',
            'numberLeaves',
            'haveTriedLeaves']
  });
  self.sortPerPageString = ko.pureComputed(function() {
    return self.sortPerPage().toString().replace('(','').replace(')','');
  });
  self.filterPerPageString = ko.pureComputed(function() {
    return self.filterPerPage().toString().replace('(','').replace(')','');
  });
  self.addMainLabel = ko.pureComputed(function() {
    return 'Add ' + self.mainLabel();
  });

  self.addSubLabel = ko.pureComputed(function() {
    return 'Add ' + self.subLabel();
  });

  self.addItemLabel = ko.pureComputed(function() {
    return 'Add ' + self.itemLabel();
  });

  self.itemNameColClass = ko.pureComputed(function() {
    return ((self.type() === 'books' || self.type() === 'videos')?'col-2':'col-3')
  });
  self.itemHref = ko.pureComputed(function() {
    href = '';
    if(self.selectedItem()) {
      href = self.nodeHref(self.selectedItem());
    }
    return href;
  });
  self.subHref = ko.pureComputed(function() {
    href = '';
    if(self.selectedSubNode()) {
      href = self.nodeHref(self.selectedSubNode());
    }
    return href;
  });
  self.mainHref = ko.pureComputed(function() {
    href = '';
    if(self.selectedMainNode()) {
      href = self.nodeHref(self.selectedMainNode());
    }
    return href;
  });
}

NodesViewModel.prototype.filter = function(page=null) {
  var self = nodesViewModel;
  var tempList = [];
  var filter = self.filterText();
  if(self.rootNode && filter !== '') {
    switch($('#filterControls input:radio:checked').val()) {
      case 'mainNameFilter':
        self.filterMainName(filter, page=page)
        .then(function(data) {
          $("html").removeClass("waiting");
          if(data) {
            self.filterNextPage(data.nextPage);
            self.filterPrevPage(data.prevPage);
            self.filterTotalItems(data.totalNodes);
            self.filterPage(data.page);
            self.filterPages(data.pages);
            tempList = tempList.concat(data.nodes.map(function(node) {
              return new Node(initialize=true, data=node);
            }));
            Promise.resolve(self.filterItems(tempList))
            .then(function() {
              $('.mt-rating-list').show();
            });
          }
        });
        break;
      case 'itemNameFilter':
        self.filterItemName(filter, page=page)
        .then(function(data) {
          $("html").removeClass("waiting");
          if(data) {
            self.filterNextPage(data.nextPage);
            self.filterPrevPage(data.prevPage);
            self.filterTotalItems(data.totalNodes);
            self.filterPage(data.page);
            self.filterPages(data.pages);
            tempList = tempList.concat(data.nodes.map(function(node) {
              return new Node(initialize=true, data=node);
            }));
            Promise.resolve(self.filterItems(tempList))
            .then(function() {
              $('.mt-rating-list').show();
            });
          }
        });
        break;
      case 'itemDescrFilter':
        self.filterItemDescription(filter, page=page)
        .then(function(data) {
          $("html").removeClass("waiting");
          if(data) {
            self.filterNextPage(data.nextPage);
            self.filterPrevPage(data.prevPage);
            self.filterTotalItems(data.totalNodes);
            self.filterPage(data.page);
            self.filterPages(data.pages);
            tempList = tempList.concat(data.nodes.map(function(node) {
              return new Node(initialize=true, data=node);
            }));
            Promise.resolve(self.filterItems(tempList))
            .then(function() {
              $('.mt-rating-list').show();
            });
          }
        });
        break;
      case 'itemReviewFilter':
        self.filterItemReview(filter, page=page)
        .then(function(data) {
          $("html").removeClass("waiting");
          if(data) {
            self.filterNextPage(data.nextPage);
            self.filterPrevPage(data.prevPage);
            self.filterTotalItems(data.totalNodes);
            self.filterPage(data.page);
            self.filterPages(data.pages);
            tempList = tempList.concat(data.nodes.map(function(node) {
              return new Node(initialize=true, data=node);
            }));
            Promise.resolve(self.filterItems(tempList))
            .then(function() {
              $('.mt-rating-list').show();
            });
          }
        });
      break;
    }
  } else {
    self.filterNextPage(null);
    self.filterPrevPage(null);
    self.filterTotalItems(null);
    self.filterPage(null);
    self.filterPages(null);
    self.filterItems([]);
  }
}

NodesViewModel.prototype.sortList = function(page=null) {
  var self = nodesViewModel;
  var tempList = [];
  //$('#sortedList i.fa, #sortedList i.far').css({'visibility':'hidden'});
  if(self.rootNode) {
    switch($('#sortControls input:radio:checked').val()) {
      case 'mainRatingSort':
        self.sortMainRating(page=page)
        .then(function(data) {
          $("html").removeClass("waiting");
          if(data) {
            self.sortNextPage(data.nextPage);
            self.sortPrevPage(data.prevPage);
            self.sortTotalItems(data.totalNodes);
            self.sortPage(data.page);
            self.sortPages(data.pages);
            tempList = tempList.concat(data.nodes.map(function(node) {
              return new Node(initialize=true, data=node);
            }));
            Promise.resolve(self.sortedItems(tempList))
            .then(function() {
              $('.mt-date-list').hide();
              $('.mt-rating-list').show();
            });
          }
        });
        break;
      case 'itemRatingSort':
        self.sortItemRating(page=page)
        .then(function(data) {
          $("html").removeClass("waiting");
          if(data) {
            self.sortNextPage(data.nextPage);
            self.sortPrevPage(data.prevPage);
            self.sortTotalItems(data.totalNodes);
            self.sortPage(data.page);
            self.sortPages(data.pages);
            tempList = tempList.concat(data.nodes.map(function(node) {
              return new Node(initialize=true, data=node);
            }));
            Promise.resolve(self.sortedItems(tempList))
            .then(function() {
              $('.mt-date-list').hide();
              $('.mt-rating-list').show();
            });
          }
        });
        break;
      case 'triedSort':
        self.sortTried(page=page)
        .then(function(data) {
          $("html").removeClass("waiting");
          if(data) {
            self.sortNextPage(data.nextPage);
            self.sortPrevPage(data.prevPage);
            self.sortTotalItems(data.totalNodes);
            self.sortPage(data.page);
            self.sortPages(data.pages);
            tempList = tempList.concat(data.nodes.map(function(node) {
              return new Node(initialize=true, data=node);
            }));
            Promise.resolve(self.sortedItems(tempList))
            .then(function() {
              $('.mt-rating-list').hide();
              $('.mt-date-list').show();
            });
          }
        });
        break;
    }
  }
}

NodesViewModel.prototype.sortMainRating = function(page=null) {
  var self = this;
  var pageStr = '';
  if(page) {
    pageStr = '&page='+page;
  }
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?level=1&infoDepth=3&excludeRoot&orderField=averageLeafRating&orderDir=desc&perPage='+self.sortPerPageString()+pageStr;
  url += '&ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, alertIds.main, self.authHeader);
}

NodesViewModel.prototype.sortItemRating = function(page=null) {
  var self = this;
  var pageStr = '';
  if(page) {
    pageStr = '&page='+page;
  }
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?level=3&excludeRoot&orderField=rating&orderDir=desc&perPage='+self.sortPerPageString()+pageStr;
  url += '&ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, alertIds.main, self.authHeader);
}

NodesViewModel.prototype.sortTried = function(page=null) {
  var self = this;
  var pageStr = '';
  if(page) {
    pageStr = '&page='+page;
  }
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?level=3&excludeRoot&orderField=dateTried&orderDir=desc&perPage='+self.sortPerPageString()+pageStr;
  url += '&ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, alertIds.main, self.authHeader);
}

NodesViewModel.prototype.filterMainName = function(filter, page=null) {
  var self = this;
  var pageStr = '';
  if(page) {
    pageStr = '&page='+page;
  }
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?level=1&excludeRoot&orderField=name&name='+filter+'&parentId='+self.rootNode.id()+'&perPage='+self.filterPerPageString()+pageStr;
  url += '&ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, alertIds.main, self.authHeader);
}

NodesViewModel.prototype.filterItemName = function(filter, page=null) {
  var self = this;
  var pageStr = '';
  if(page) {
    pageStr = '&page='+page;
  }
  var tempList = [];
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?level=3&excludeRoot&orderField=name&name='+filter+'&perPage='+self.filterPerPageString()+pageStr;
  url += '&ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, alertIds.main, self.authHeader);
}

NodesViewModel.prototype.filterItemDescription = function(filter, page=null) {
  var self = this;
  var pageStr = '';
  if(page) {
    pageStr = '&page='+page;
  }
  var tempList = [];
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?level=3&excludeRoot&orderField=name&description='+filter+'&perPage='+self.filterPerPageString()+pageStr;
  url += '&ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, alertIds.main, self.authHeader);
}

NodesViewModel.prototype.filterItemReview = function(filter, page=null) {
  var self = this;
  var pageStr = '';
  if(page) {
    pageStr = '&page='+page;
  }
  var tempList = [];
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?level=3&excludeRoot&&orderField=name&review='+filter+'&perPage='+self.filterPerPageString()+pageStr;
  url += '&ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, alertIds.main, self.authHeader);
}

NodesViewModel.prototype.nodeHref = function(nodeId) {
  var self = this;
  return '#/'+self.type()+'/'+nodeId;
}

NodesViewModel.prototype.filteredNodeSlug = function(nodeId) {
  var self = this;
  var slug = ''
  var node = self.filterItems().find(function(item) {
    return item.id() == nodeId;
  });
  return node.slug();
}

NodesViewModel.prototype.sortedNodeSlug = function(nodeId) {
  var self = this;
  var slug = ''
  var node = self.sortedItems().find(function(item) {
    return item.id() == nodeId;
  });
  return node.slug();
}

NodesViewModel.prototype.cancelLogin = function() {
  var self = this;
  if(self.previousUser) {
    self.currentUser(self.previousUser);
  }
  if(self.previousUserPassword) {
    self.currentUserPassword = self.previousUserPassword;
  }
  $('.nav-link.btn').css({'visibility':'visible'});
}

NodesViewModel.prototype.login = function(username, password, type) {
  var self = this;
  setAlert('','', alertIds.login);
  var url = secrets['MY_THINGS_SERVER'] + '/admin/check/user/';
  url += encodeURIComponent(username);
  self.loggedIn(false);
  return self.ajax('GET', url, alertIds.login, self.authHeader,null ,5000)
  .then(function(data) {
    if(data) {
      self.authHeader = {'Authorization':'Basic ' + btoa(username + ':' + password)};
      var url = secrets['MY_THINGS_SERVER'] + '/admin/user/' + username;
      return self.ajax('GET', url, alertIds.login, self.authHeader)
    } else {
      return data
    }
  })
}

NodesViewModel.prototype.logout = function() {
  var self = this;
  self.currentUser('');
  self.currentUserId = null;
  self.currentUserPassword = '';
  self.authHeader = {};
  if(self.selectedItem()) {
    self.unloadItem();
    $('.mt-item-a').removeClass('active');
    self.selectedItem(null);
    self.selectedSubNode(null);
    self.selectedMainNode(null);
    self.mainNodes.removeAll();
  }
  self.mainNodes([]);
  self.sortedItems([]);
  self.loggedIn(false);
}

NodesViewModel.prototype.sortByIndexOrPubDateOrName = function (left, right) {

  if(left.sortIndex() !== null && right.sortIndex() !== null &&
     left.sortIndex() !== undefined && right.sortIndex() !== undefined) {
       if(left.sortIndex() == right.sortIndex()) {
         return (left.name().toLowerCase() == right.name().toLowerCase() ? 0 : (left.name().toLowerCase() < right.name().toLowerCase() ? -1 : 1));
       } else {
         return (parseInt(left.sortIndex()) < parseInt(right.sortIndex()) ? -1 : 1)
       }
    return (left.sortIndex() == right.sortIndex() ? 0 : (parseInt(left.sortIndex()) < parseInt(right.sortIndex()) ? -1 : 1));
  } else if('publishedDate' in left.nodeInfo() && 'publishedDate' in right.nodeInfo() &&
            left.nodeInfo()['publishedDate']() !== null && right.nodeInfo()['publishedDate']() !== null &&
            left.nodeInfo()['publishedDate']() !== undefined && right.nodeInfo()['publishedDate']() !== undefined) {
    var dleft = new Date(left.nodeInfo()['publishedDate']());
    var dright = new Date(right.nodeInfo()['publishedDate']());
    if(dleft.getTime() == dright.getTime()) {
      return (left.name().toLowerCase() == right.name().toLowerCase() ? 0 : (left.name().toLowerCase() < right.name().toLowerCase() ? -1 : 1));
    } else {
      return (dleft < dright ? -1 : 1);
    }
  } else {
    return (left.name().toLowerCase() == right.name().toLowerCase() ? 0 : (left.name().toLowerCase() < right.name().toLowerCase() ? -1 : 1));
  }
}

NodesViewModel.prototype.setLabels = function() {
  var self = this;
  self.mainLabel(self.mainLabels[self.type()]);
  self.subLabel(self.subLabels[self.type()]);
  self.itemLabel(self.itemLabels[self.type()]);
  self.triedLabel(self.triedLabels[self.type()]);
  self.sortIndexLabel(self.sortIndexLabels[self.type()]);
  self.defaultAlert('');
  self.nodeInfo1Key(self.nodeInfo1Keys[self.type()]);
  self.nodeInfo2Key(self.nodeInfo2Keys[self.type()]);
  self.nodeInfo3Key(self.nodeInfo3Keys[self.type()]);
  self.nodeInfo4Key(self.nodeInfo4Keys[self.type()]);
  self.nodeInfo5Key(self.nodeInfo5Keys[self.type()]);
  self.nodeInfo6Key(self.nodeInfo6Keys[self.type()]);
  self.nodeInfo1Label(self.nodeInfo1Labels[self.type()]);
  self.nodeInfo2Label(self.nodeInfo2Labels[self.type()]);
  self.nodeInfo3Label(self.nodeInfo3Labels[self.type()]);
  self.nodeInfo4Label(self.nodeInfo4Labels[self.type()]);
  self.nodeInfo5Label(self.nodeInfo5Labels[self.type()]);
  self.nodeInfo6Label(self.nodeInfo6Labels[self.type()]);
  $('.mt-add-buttons button').tooltip('dispose');
  $('.mt-add-buttons button').tooltip('enable');
}

NodesViewModel.prototype.updateItemListTooltips = function() {
  var self = this;
  $('#itemList [data-toggle="tooltip"]').tooltip('enable');
  editItemNodeModel.updateItemEditTooltips();
}

NodesViewModel.prototype.updateControlsTooltips = function() {
  var self = this;
  $('#controls [data-toggle="tooltip"]').tooltip('enable');
}

NodesViewModel.prototype.setType = function(errorMessage = '') {
  var self = this;
  self.setLabels();
  nodesViewModel.visible(false);
  $("html").addClass("waiting");
  $('#loadingDialog').modal('show');
  return nodesViewModel.getMainNodes()
  .then(function(response) {
    $("html").removeClass("waiting");
    if(response) {
      // build adjacencyList structure
      self.adjacencyList = {};
      response.nodes.forEach(function(node) {
        if(!(node.parentId in self.adjacencyList)) {
          self.adjacencyList[node.parentId] = [];
        }
        var newNode = new Node(true, node, {'required':self.requiredAspects,
                                            'nodeInfo': self.nodeInfoKeys()});
        self.initNode(newNode);
        self.adjacencyList[node.parentId].push(newNode);
      });
      self.rootNode = self.buildNodeHierarchy(nodeId=null, parentId=null, adjacencyList =self.adjacencyList);
      self.rootNode.children().sort(self.sortByIndexOrPubDateOrName)
      self.mainNodes(self.rootNode.children());
      self.filterItems([]);
      self.sortedItems([]);
    }
    $('#loadingDialog').modal('hide');
    return response;
  })
  .then(function(response) {
    if(response) {
      $('#accordianMain i.fa, #accordianMain i.far').css({'visibility':'visible'});
      $('.mt-add-buttons, .nav-item, .nav-link').css({'visibility':'visible'});
      self.updateItemListTooltips();
      self.updateControlsTooltips();
      if(errorMessage !== '') {
        setAlert(errorMessage, 'alert-danger', alertIds.main)
      }
      nodesViewModel.visible(true);
    }
    return response;
  })
}

NodesViewModel.prototype.loadItem = function() {
  var self = this;
  if($('.mt-edit-buttons, .mt-item-form').css('visibility') === 'hidden') {
    // only do this if it is currently hidden
    $('.mt-edit-buttons, .mt-item-form').css({'visibility':'visible'});
    $('#itemSortIndex').removeClass("d-none");
  }
  editItemNodeModel.updateItemEditTooltips();
}

NodesViewModel.prototype.unloadItem = function() {
  var self = this;
  if($('.mt-edit-buttons, .mt-item-form').css('visibility') === 'visible') {
    // only do this if it is currently visible
    $('.mt-edit-buttons, .mt-item-form').css({'visibility':'hidden'});
    $('#itemSortIndex').addClass("d-none");
  }
}

NodesViewModel.prototype.findNode = function(id) {
  // TO DO: make this recursive
  var self = this;
  var foundNode = null;
  for(var indx=0; indx<self.mainNodes().length; indx++) {
    var mainNode = self.mainNodes()[indx];
    if(mainNode.id() == id) {
      foundNode = mainNode;
      break;
    }
    for(var subIndx=0; subIndx< mainNode.children().length; subIndx++) {
      var subNode = mainNode.children()[subIndx];
      if(subNode.id() == id) {
        foundNode = subNode;
        break;
      }
      for(var itemIndx=0; itemIndx<subNode.children().length; itemIndx++) {
        var item = subNode.children()[itemIndx];
        if(item.id() == id) {
          foundNode = item;
          break;
        }
      }
    }
  }
  return foundNode;
}

NodesViewModel.prototype.proceedWithMainNodeDelete = function() {
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/node/';
  url += encodeURIComponent(self.selectedMainNode().id());
  self.ajax('DELETE', url, alertIds.main, self.authHeader)
  .then(function(response) {
    $("html").removeClass("waiting");
    if(response) {
      $('a.mt-main-a').removeClass('active');
      var nodeName = self.selectedMainNode().name();
      var indexToRemove = self.adjacencyList[self.selectedMainNode().parentId()].indexOf(self.selectedMainNode());
      if(indexToRemove !== -1) {
        self.adjacencyList[self.rootNode.id()].splice(indexToRemove, 1);
      }
      self.rootNode.children.remove(self.selectedMainNode());
      self.mainNodes(self.rootNode.children());
      self.selectedMainNode(null);
      self.unloadItem();
      $('mt-main-collapse').collapse('hide');
      setAlert('Successfully deleted "' + nodeName + '"', 'alert-success');
      self.filterItems([]);
      self.sortedItems([]);
    }
  });
}

NodesViewModel.prototype.beginDeleteMainNode = function() {
  var self = this;
  $('#confirmDeleteMainNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.beginDeleteSubNode = function() {
  var self = this;
  $('#confirmDeleteSubNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.beginDeleteItem = function() {
  var self = this;
  $('#confirmDeleteItem').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.beginEditItem = function() {
  var self = this;
  editItemNodeModel.populateFields(nodesViewModel.selectedMainNode().copy(),
                                   nodesViewModel.selectedSubNode().copy(),
                                   nodesViewModel.selectedItem().copy());
  $('#editItemNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.proceedWithSubNodeDelete = function() {
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/node/';
  url += encodeURIComponent(self.selectedSubNode().id());
  self.ajax('DELETE', url, alertIds.main, self.authHeader)
  .then(function(response) {
    $("html").removeClass("waiting");
    if(response) {
      $('a.mt-sub-a').removeClass('active');
      var nodeName = self.selectedSubNode().name();
      var indexToRemove = self.adjacencyList[self.selectedSubNode().parentId()].indexOf(self.selectedSubNode());
      if(indexToRemove !== -1) {
        self.adjacencyList[self.selectedMainNode().id()].splice(indexToRemove, 1);
      }
      self.selectedMainNode().children.remove(self.selectedSubNode());
      self.selectedSubNode(null);
      self.unloadItem();
      $('mt-sub-collapse').collapse('hide');
      setAlert('Successfully deleted "' + nodeName + '"', 'alert-success');
      self.filterItems([]);
      self.sortedItems([]);
    }
  });
}

NodesViewModel.prototype.proceedWithItemDelete = function() {
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/node/';
  url += encodeURIComponent(self.selectedItem().id());
  self.itemDeleteIcon(self.defaultSpinnerIcon);
  self.ajax('DELETE', url, alertIds.main, self.authHeader)
  .then(function(response) {
    self.itemDeleteIcon(self.defaultItemDeleteIcon);
    $("html").removeClass("waiting");
    if(response) {
      $('a.mt-item-a').removeClass('active');
      var nodeName = self.selectedItem().name();
      var indexToRemove = self.adjacencyList[self.selectedItem().parentId()].indexOf(self.selectedItem());
      if(indexToRemove !== -1) {
        self.adjacencyList[self.selectedSubNode().id()].splice(indexToRemove, 1);
      }
      self.selectedSubNode().children.remove(self.selectedItem());
      self.selectedItem(null);
      self.unloadItem();
      setAlert('Successfully deleted "' + nodeName + '"', 'alert-success');
      self.filterItems([]);
      self.sortedItems([]);
    }
  });
}

NodesViewModel.prototype.beginEditMainNode = function() {
  var self = this;
  editMainNodeModel.name(nodesViewModel.selectedMainNode().name());
  editMainNodeModel.description(nodesViewModel.selectedMainNode().description());
  $('#editMainNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.proceedWithMainNodeEdit = function(nodeData = {}) {
  // add a main or sub node
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/node/' + self.selectedMainNode().id();
  $('html').addClass('waitng');
  self.ajax('PUT', url, alertIds.main, self.authHeader,nodeData)
  .then(function(node) {
    $("html").removeClass("waiting");
    if(node) {
      self.selectedMainNode().name(node.name);
    self.selectedMainNode().description(node.description);
    $('a[mt-data-id="' + self.selectedMainNode().id() + '"] span.mt-tooltip').tooltip('dispose');
    $('a[mt-data-id="' + self.selectedMainNode().id() + '"] span.mt-tooltip').tooltip('enable');
    setAlert('Successfully Edited "' + node.name +'"', 'alert-success');
    self.mainNodes.sort(self.sortByIndexOrPubDateOrName);
    self.context.redirect('#/'+self.type()+'/'+self.selectedMainNode().id());
      self.filterItems([]);
      self.sortedItems([]);
    }
  });
}

NodesViewModel.prototype.beginEditSubNode = function() {
  var self = this;
  editSubNodeModel.name(nodesViewModel.selectedSubNode().name());
  editSubNodeModel.description(nodesViewModel.selectedSubNode().description());
  $('#editSubNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.proceedWithSubNodeEdit = function(nodeData = {}) {
  // add a main or sub node
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/node/' + self.selectedSubNode().id();
  $("html").addClass("waiting");
  self.ajax('PUT', url, alertIds.main, self.authHeader, nodeDate)
  .then(function(node) {
    $("html").removeClass("waiting");
    if(node) {
      self.selectedSubNode().name(node.name);
      self.selectedSubNode().description(node.description);
      $('a[mt-data-id="' + self.selectedSubNode().id() + '"] span.mt-tooltip').tooltip('dispose');
      $('a[mt-data-id="' + self.selectedSubNode().id() + '"] span.mt-tooltip').tooltip('enable');
      setAlert('Successfully Edited "' + node.name +'"', 'alert-success');
      self.selectedMainNode().children.sort(self.sortByIndexOrPubDateOrName);
      self.context.redirect('#/'+self.type()+'/'+self.selectedMainNode().id()+'/'+self.selectedSubNode().id());
      self.filterItems([]);
      self.sortedItems([]);
    }
  });
}

NodesViewModel.prototype.beginAddMain = function() {
  $('#addMainNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.addNode = function(nodeData={}, alertId=alertIds.main) {
  // add a node
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/add/node';
  var addedNode = null;
  $("html").addClass("waiting");
  return self.ajax('POST', url, alertId, self.authHeader, nodeData)
  .then(function(node) {
    $("html").removeClass("waiting");
    if(node){
      // build adjacencyList structure
      addedNode = new Node(true, node, {'required':self.requiredAspects,
                                        'nodeInfo': self.nodeInfoKeys()});
      self.initNode(addedNode);
      if(!(node.parentId in self.adjacencyList)) {
        self.adjacencyList[node.parentId] = [];
      }
      self.adjacencyList[node.parentId].push(addedNode);
      var mainParent = self.findNode(node.parentId);
      if(mainParent) {
        mainParent.children.push(addedNode);
        mainParent.children.sort(self.sortByIndexOrPubDateOrName);
      } else {
        self.rootNode.children.push(addedNode);
        self.rootNode.children.sort(self.sortByIndexOrPubDateOrName);
        self.mainNodes(self.rootNode.children());
      }
      return node;
    }
  })
  .then(function(data) {
    if(data) {
      var main = false;
      var sub = false;
      var item = false;
      if(addedNode.parentId() === self.rootNode.id()) {
        main = true;
        addedNode.nodeInfo()['needLeaves'](0);
        addedNode.nodeInfo()['numberSubs'](0);
        addedNode.nodeInfo()['numberLeaves'](0);
        addedNode.nodeInfo()['averageLeafRating'](null);
        $('a.mt-main-a').removeClass('active');
        $('.mt-main-collapse').collapse('hide');
        self.selectedMainNode(addedNode);
        $('a[mt-data-id="' + addedNode.id() + '"]').addClass('active');
      } else if(addedNode.parentId() === self.selectedMainNode().id()){
        sub = true;
        $('a.mt-sub-a').removeClass('active');
        $('.mt-sub-collapse').collapse('hide');
        $('#accordianCollapse_' + addedNode.parentId()).collapse('show');
        self.selectedSubNode(addedNode);
        $('a[mt-data-id="' + addedNode.id() + '"]').addClass('active');
      } else {
        item = true;;
        $('a.mt-item-a').removeClass('active');
        $('a[mt-data-id="' + addedNode.id() + '"]').addClass('active');
        self.selectedItem(addedNode);
        self.loadItem();
        $('#accordianCollapse_' + addedNode.parentId()).collapse('show');
        $('#editItemNode').modal("hide");
      }
      self.updateItemListTooltips();
      setAlert('Successfully Added "' + addedNode.name() +'"', 'alert-success');
      $('#accordianMain i.fa, #accordianMain i.far').css({'visibility':'visible'});
      self.filterItems([]);
      self.sortedItems([]);
      self.context.redirect('#/'+self.type()+'/'+addedNode.id());
    }
  });
}

NodesViewModel.prototype.beginAddSub = function() {
  $('#addSubNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.beginAddItem = function() {
  var self = this;
  var nodeInfo = {};
  nodeInfo[nodesViewModel.nodeInfo1Key()] = null;
  nodeInfo[nodesViewModel.nodeInfo2Key()] = null;
  nodeInfo[nodesViewModel.nodeInfo3Key()] = null;
  nodeInfo[nodesViewModel.nodeInfo4Key()] = null;
  nodeInfo[nodesViewModel.nodeInfo5Key()] = null;
  nodeInfo[nodesViewModel.nodeInfo6Key()] = null;
  var nodeData = {
    owner: nodesViewModel.currentUser(),
    type: nodesViewModel.type(),
    parentId: nodesViewModel.selectedSubNode().id(),
    nodeInfo: nodeInfo,
    haveTried: false,
    dateTried: null,
    dateReviewed: null,
    rating: null,
    name: '',
    uri: ''
  }
  var newNode = new Node(initialize=true, data=nodeData)
  editItemNodeModel.populateFields(nodesViewModel.selectedMainNode().copy(),
                                   nodesViewModel.selectedSubNode().copy(),
                                   newNode);
  $('#editItemNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.toggleItemNeed = function() {
  var self = nodesViewModel;
  if(self.selectedItem() && self.selectedMainNode() && self.selectedSubNode()) {
    self.selectedItem().toggleNeed();
    return self.updateItem()
  }
}

NodesViewModel.prototype.updateItem = function() {
  var self = this;
  var url = self.selectedItem().uri().replace('http://', 'https://');
  var saveData = self.selectedItem().sanitize();
  self.itemSaveIcon(self.defaultSpinnerIcon);
  $("html").addClass("waiting");
  return self.ajax('PUT', url, alertIds.editItemNode, self.authHeader, saveData)
  .then(function(response) {
    self.itemSaveIcon(self.defaultItemSaveIcon);
    $("html").removeClass("waiting");
    if(response) {
      setAlert('Successfully updated "' + response.name +'"', 'alert-success');
      self.filterItems([]);
      self.sortedItems([]);
    }
  });
}

NodesViewModel.prototype.getMainNodes = function() {
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?level=1&infoDepth=3';
  url += '&ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, alertIds.main, self.authHeader);
}

NodesViewModel.prototype.getMainSubtree = function(id) {
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/tree?depth=3&id='+id;
  url += 'ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  $("html").addClass("waiting");
  return self.ajax('GET', url, alertIds.main, self.authHeader)
  .then(function(tree) {
    $("html").removeClass("waiting");
    if(tree) {
      var adjacencyList = {};
      tree.nodes.forEach(function(node) {
        if(!(node.parentId in adjacencyList)) {
          adjacencyList[node.parentId] = [];
        }
        var newNode = new Node(true, node, {'required':nodesViewModel.requiredAspects,
                                            'nodeInfo': nodesViewModel.nodeInfoKeys()});
        nodesViewModel.initNode(newNode);
        adjacencyList[node.parentId].push(newNode);
      });
      var main = nodesViewModel.buildNodeHierarchy(node=null, parentId=null, adjacencyList=adjacencyList).children()[0];
      main.children.sort(nodesViewModel.sortByIndexOrPubDateOrName);
      return main;
    }
  });
}

NodesViewModel.prototype.initNode = function(node) {
  var self = this;
  if(node.nodeInfo() === null) {
    node.nodeInfo({});
  }
  if(!(self.nodeInfo1Key() in node.nodeInfo())) {
    node.nodeInfo()[self.nodeInfo1Key()] = ko.observable(null);
  }
  if(!(self.nodeInfo2Key() in node.nodeInfo())) {
    node.nodeInfo()[self.nodeInfo2Key()] = ko.observable(null);
  }
  if(!(self.nodeInfo3Key() in node.nodeInfo())) {
    node.nodeInfo()[self.nodeInfo3Key()] = ko.observable(null);
  }
  if(!(self.nodeInfo4Key() in node.nodeInfo())) {
    node.nodeInfo()[self.nodeInfo4Key()] = ko.observable(null);
  }
  if(!(self.nodeInfo5Key() in node.nodeInfo())) {
    node.nodeInfo()[self.nodeInfo5Key()] = ko.observable(null);
  }
  if(!(self.nodeInfo6Key() in node.nodeInfo())) {
    node.nodeInfo()[self.nodeInfo6Key()] = ko.observable(null);
  }
  node.nodeTooltip = ko.pureComputed(function() {
    var subLabel = (self.isMain(node) ? self.subLabel() : self.itemLabel());
    if(self.isMain(node)) {
      var tooltipText = '<h5>' + node.name() + ':</h5>' +
                        (node.description() ? '<p>' + node.description() + '</p><br>' : '') +
                        '<b>' + self.subLabel() + ':</b><span> ' + self.mainNumberSubs(node) + '</span><br>' +
                        '<b>' + self.itemLabel() + 's:</b><span> ' + self.mainNumberLeaves(node) + '</span><br>' +
                        '<b>Have ' + self.triedLabel() + ':</b><span> ' + self.mainNumLeavesHaveTried(node) + '</span><br>' +
                        '<b>Need:</b><span> ' + self.mainLeavesNeeded(node) + '</span><br>';
    } else {
      var tooltipText = '<h5>' + node.name() + ':</h5>' +
                        (node.description() ? '<p>' + node.description() + '</p><br>' : '') +
                        '<b>' + self.itemLabel() + 's:</b><span> ' + node.children().length + '</span><br>' +
                        '<b>Have ' + self.triedLabel() + ':</b><span> ' + self.numLeavesHaveTried(node) + '</span><br>' +
                        '<b>Need:</b><span> ' + self.leavesNeeded(node) + '</span><br>';
    }
    return tooltipText;
  });
}

NodesViewModel.prototype.isMain = function(node) {
  var self = this;
  if(node) {
    return node.parentId() == self.rootNode.id();
  }
  return node;
}

NodesViewModel.prototype.leaves = function(node, leaves = []) {
  var self = nodesViewModel;
  if(node) {
    var parent = self.findNode(node.parentId());
    if(node.children().length === 0 && !self.isMain(parent) && !self.isMain(node)) {
      leaves.push(node);
    }
    node.children().forEach(function(child) {
      leaves.concat(self.leaves(child, leaves));
    })
  }
  return leaves;
}

NodesViewModel.prototype.leavesNeeded = function(node) {
  self = nodesViewModel;
  var needed = 0;
  if(node) {
    var leaves = self.leaves(node);
    for(var indx=0; indx<leaves.length; indx++) {
      if(leaves[indx].need()) {
        needed++;
      }
    }
  }
  return needed;
}

NodesViewModel.prototype.mainLeavesNeeded = function(node) {
  self = nodesViewModel;
  var needed = 0;
  if(node) {
    if(!('needLeaves' in node.nodeInfo()) || ('needLeaves' in node.nodeInfo() && (node.nodeInfo()['needLeaves']() === null
                                   || typeof node.nodeInfo()['needLeaves']() === 'undefined'))) {
      needed = 0;
    } else {
      if(node.children().length > 0) {
        needed = self.leavesNeeded(node);
      } else {
        needed = node.nodeInfo()['needLeaves']();
      }
    }
  }
  return needed;
}

NodesViewModel.prototype.numLeavesHaveTried = function(node) {
  var self = nodesViewModel;
  var count = 0;
  if(node) {
    var leaves = self.leaves(node);
    for(var indx=0; indx<leaves.length; indx++) {
      if(leaves[indx].haveTried()) {
        count++;
      }
    }
  }
  return count;
}

NodesViewModel.prototype.mainNumLeavesHaveTried = function(node) {
  var self = nodesViewModel;
  var haveTried = 0;
  if(node) {
    if(node.children().length > 0) {
      haveTried = self.numLeavesHaveTried(node);
    } else {
      haveTried = node.nodeInfo()['haveTriedLeaves']();
      if(!haveTried) {
        haveTried = 0;
      }
    }
  }
  return haveTried;
}

NodesViewModel.prototype.mainNumberSubs = function(node) {
  var self = nodesViewModel;
  var numSubs = 0;
  if(node) {
    if(node.children().length > 0) {
      numSubs = node.children().length;
    } else {
      numSubs = node.nodeInfo()['numberSubs']();
      if(!numSubs) {
        numSubs = 0;
      }
    }
  }
  return numSubs;
}

NodesViewModel.prototype.mainNumberLeaves = function(node) {
  var self = nodesViewModel;
  var numLeaves = 0;
  if(node) {
    if(node.children().length > 0) {
      numLeaves = self.leaves(node).length;
    } else {
      numLeaves = node.nodeInfo()['numberLeaves']();
      if(!numLeaves) {
        numLeaves = 0;
      }
    }
  }
  return numLeaves;
}

NodesViewModel.prototype.leavesHaveTried = function(node) {
  var self = nodesViewModel;
  if(node) {
    var leaves = self.leaves(node);
    for(var indx=0; indx<leaves.length; indx++) {
      if(leaves[indx].haveTried()) {
        return true;
      }
    }
  }
  return false;
}

NodesViewModel.prototype.mainLeavesHaveTried = function(node) {
  var self = nodesViewModel;
  var haveTried = 0;
  if(node) {
    if(node.children().length > 0) {
      numTried = self.leavesHaveTried(node);
    } else {
      numTried = node.nodeInfo()['haveTriedLeaves']();
      if(!numTried) {
        numTried = 0;
      }
    }
  }
  return haveTried;
}

NodesViewModel.prototype.allLeavesHaveTried = function(node) {
  var self = nodesViewModel;
  if(node) {
    var leaves = self.leaves(node);
    for(var indx=0; indx<leaves.length; indx++) {
      if(!leaves[indx].haveTried()) {
        return false;
      }
    }
  }
  return true;
}

NodesViewModel.prototype.mainAllLeavesHaveTried = function(node) {
  var self = nodesViewModel;
  var allTried = false;
  if(node) {
    if(node.children().length > 0) {
      allTried = self.allLeavesHaveTried(node);
    } else {
      if(self.mainLeavesHaveTried(node) == self.mainNumberLeaves(node)) {
        allTried = true;
      }
    }
  }
  return allTried;
}

NodesViewModel.prototype.leavesHaveReviewed = function(node) {
  var self = nodesViewModel;
  if(node) {
    var leaves = self.leaves(node);
    for(var indx=0; indx<leaves.length; indx++) {
      if(leaves[indx].review()) {
        return true;
      }
    }
  }
  return false;
}

NodesViewModel.prototype.leavesHaveRating = function(node) {
  var self = nodesViewModel;
  if(node) {
    var leaves = self.leaves(node);
    for(var indx=0; indx<leaves.length; indx++) {
      if(leaves[indx].rating() !== null && leaves[indx].rating() !== '') {
        return true;
      }
    }
  }
  return false;
}

NodesViewModel.prototype.mainLeavesHaveRating = function(node) {
  var self = nodesViewModel;
  var haveRating = false;
  if(node) {
    if(node.children().length > 0) {
      haveRating = self.leavesHaveRating(node);
    } else {
      averageRating = node.nodeInfo()['averageLeafRating']();
      if(averageRating === null) {
        haveRating = false;
      }
    }
  }
  return haveRating;
}

NodesViewModel.prototype.averageRating = function(node) {
  var self = nodesViewModel;
  var numRated = 0;
  var sumRating = 0;
  if(node) {
    var leaves = self.leaves(node);
    var node = self.findNode(node);
    for(var indx=0; indx<leaves.length; indx++) {
      if(leaves[indx].rating() !== null && leaves[indx].rating() !== '') {
        numRated++;
        sumRating += Math.floor(leaves[indx].rating());
      }
    }
  }
  if(numRated === 0) {
    return null;
  } else {
    return Math.round(sumRating / numRated);
  }
}

NodesViewModel.prototype.mainAverageRating = function(node) {
  var self = nodesViewModel;
  var averageRating = null;
  if(node) {
    if (node.children().length > 0 || !('averageLeafRating' in node.nodeInfo()) || ('averageLeafRating' in node.nodeInfo() && node.nodeInfo()['averageLeafRating'] == null)) {
      averageRating = self.averageRating(node);
    } else {
      averageRating = node.nodeInfo()['averageLeafRating']();
      if(!averageRating) {
        averageRating = null;
      }
    }
  }
  return averageRating;
}

NodesViewModel.prototype.getTree = function(node) {
  // return the node tree that contains this node
  var self = this;
  var thisNode = node;
  while(thisNode.parentId() !== self.rootNode.id()) {
    thisNode = self.findNode(thisNode.parentId());
  }
  return thisNode;
}

NodesViewModel.prototype.buildNodeHierarchy = function(node=null, parentId=null, adjacencyList=null) {
  var self = this;
  var sameParentList;
  var children;
  if(parentId in adjacencyList) {
    sameParentList = adjacencyList[parentId];
  } else {
    // this is a leaf node
    return node;
  }
  sameParentList.forEach(function(sibling) {
    // for each node with  the same parent
    if(node === null) {
      // this is the first time through the recursion
      node = sibling;
    } else {
      node.children.push(sibling);
    }
    self.buildNodeHierarchy(sibling, sibling.id(), adjacencyList);
  });
  return node;
}

NodesViewModel.prototype.ajax = function(method, uri, alertId=alertIds.main, authHeader=null, data=null, timeout=defaultRequestTimeout) {
  var self = this;
  setAlert('');
  lastAjaxError = '';
  var errorMessage = '';
  $("html").addClass("waiting");
  var request = {
    url: uri,
    type: method,
    contentType: "application/json",
    accepts: "application/json",
    cache: false,
    timeout: timeout
  };
  if(data !== null) {
    request.dataType = 'json';
    request.data = JSON.stringify(data);
  }
  if(authHeader !== null) {
    request.headers = authHeader;
  }
  return Promise.resolve($.ajax(request))
  .catch(function(err) {
    $("html").removeClass("waiting");
    if('responseJSON' in err && 'error' in err.responseJSON) {
      errorMessage = err.responseJSON['error'];
    } else if ('statusText' in err) {
      errorMessage = err.statusText;
    } else if('state' in err) {
      errorMessage = err.state();
    }
    if('message' in err) {
      errorMessage = errorMessage + ': ' + err.message;
    }
    if(errorMessage === 'rejected' || errorMessage ==='timeout') {
      errorMessage = 'Possible network issue. Please try again later: ' + errorMessage;
    }
    setAlert('Error contacting remote server ' + secrets['MY_THINGS_SERVER'] + ': ' + errorMessage, 'alert-danger', alertId);
    lastAjaxError = errorMessage;
    return false;
  })
}

NodesViewModel.prototype.viewDescription = function() {
  var self = this;
  if(nodesViewModel.selectedItem().description()) {
    viewTextModel.text(nodesViewModel.selectedItem().description());
    viewTextModel.name(nodesViewModel.selectedItem().name());
    viewTextModel.header('Description');
    $('#viewText').modal({show: true});
  }
}

NodesViewModel.prototype.viewReview = function() {
  var self = this;
  if(nodesViewModel.selectedItem().review()) {
    viewTextModel.text(nodesViewModel.selectedItem().review());
    viewTextModel.name(nodesViewModel.selectedItem().name());
    viewTextModel.header('Review');
    $('#viewText').modal({show: true});
  }
}

var AddMainNodeModel = function() {
  var self = this;
  self.name = ko.observable();
  self.description = ko.observable();
}

AddMainNodeModel.prototype.addMainNode = function() {
  var self = this;
  var nodeData = {
    name: self.name(),
    owner: nodesViewModel.currentUser(),
    description: self.description(),
    parentId: nodesViewModel.rootNode.id(),
    type: nodesViewModel.type()
  }
  self.name('');
  self.description('');
  nodesViewModel.addNode(nodeData);
}

var AddSubNodeModel = function() {
  var self = this;
  self.name = ko.observable();
  self.description = ko.observable();
}

AddSubNodeModel.prototype.addSubNode = function() {
  var self = this;
  var nodeData = {
    name: self.name(),
    owner: nodesViewModel.currentUser(),
    description: self.description(),
    parentId: nodesViewModel.selectedMainNode().id(),
    type: nodesViewModel.type()
  }
  self.name('');
  self.description('');
  nodesViewModel.addNode(nodeData);
}

var EditMainNodeModel = function() {
  var self = this;
  self.name = ko.observable();
  self.description = ko.observable();
}

EditMainNodeModel.prototype.editMainNode = function() {
  var self = this;
  var nodeData = {
    name: self.name(),
    description: self.description(),
  }
  self.name('');
  self.description('');
  nodesViewModel.proceedWithMainNodeEdit(nodeData);
}

var EditSubNodeModel = function() {
  var self = this;
  self.name = ko.observable();
  self.description = ko.observable();
}

EditSubNodeModel.prototype.editSubNode = function() {
  var self = this;
  var nodeData = {
    name: self.name(),
    description: self.description(),
  }
  self.name('');
  self.description('');
  nodesViewModel.proceedWithSubNodeEdit(nodeData);
}

var EditItemNodeModel = function() {
  var self = this;
  self.mainNode = ko.observable();
  self.subNode = ko.observable();
  self.itemNode = ko.observable()
  self.populateFields();
}

EditItemNodeModel.prototype.populateFields = function(mainNode = null, subNode = null, itemNode = null) {
  var self = this;
  self.mainNode(mainNode);
  self.subNode(subNode);
  self.itemNode(self.validateItemNode(itemNode));
}

EditItemNodeModel.prototype.validateItemNode = function(itemNode) {
  var self = this;
  if(itemNode !== null) {
    var requiredAspects = ['sortIndex', 'name', 'haveTried', 'dateTried', 'image',
                        'description', 'dateReviewed', 'rating', 'review', 'nodeInfo'];
    var requiredNodeInfoAspects = [nodesViewModel.nodeInfo1Keys[nodesViewModel.type()],
                                nodesViewModel.nodeInfo2Keys[nodesViewModel.type()],
                                nodesViewModel.nodeInfo3Keys[nodesViewModel.type()],
                                nodesViewModel.nodeInfo4Keys[nodesViewModel.type()],
                                nodesViewModel.nodeInfo5Keys[nodesViewModel.type()],
                                nodesViewModel.nodeInfo6Keys[nodesViewModel.type()]];
    for(key in requiredAspects) {
      if(!(requiredAspects[key] in itemNode)) {
        if(requiredAspects[key] === 'nodeInfo') {
          itemNode[requiredAspects[key]] = ko.observable({});
        } else {
          itemNode[requiredAspects[key]] = ko.observable(null);
        }
      }
    }
    for(key in requiredNodeInfoAspects) {
      if(!(requiredNodeInfoAspects[key] in itemNode.nodeInfo())) {
        itemNode.nodeInfo()[requiredNodeInfoAspects[key]] = ko.observable(null);
      }
    }
  }
  return itemNode;
}

EditItemNodeModel.prototype.updateItemEditTooltips = function() {
  var self = this;
  $('#itemDetails [data-toggle="tooltip"]').tooltip('enable');
  $('#editItemNode [data-toggle="tooltip"]').tooltip('enable');
}

EditItemNodeModel.prototype.fillItemFromGoogle = function() {
  var self = this;
  if(!('ISBN' in self.itemNode().nodeInfo()) || self.itemNode().nodeInfo()['ISBN']() === null || self.itemNode().nodeInfo()['ISBN']().length ===0) {
    setAlert('No ISBN information in selected ' + nodesViewModel.itemLabel(), 'alert-danger');
    return;
  }
  // remove any dashes
  self.itemNode().nodeInfo()['ISBN'](self.itemNode().nodeInfo()['ISBN']().replace('-','').trim());
  var url = 'https://www.googleapis.com/books/v1/volumes?q=';
  url += encodeURIComponent('ISBN=' + self.itemNode().nodeInfo()['ISBN']());
  url += '&' + encodeURIComponent('key=' + secrets['MY_BOOKS_KEY']);
  nodesViewModel.fillItemFromGoogleIcon(nodesViewModel.defaultSpinnerIcon);
  $("html").addClass("waiting");
  nodesViewModel.ajax('GET', url, alertIds.editItemNode, nodesViewModel.authHeader)
  .then(function(data) {
    $("html").removeClass("waiting");
    nodesViewModel.fillItemFromGoogleIcon(nodesViewModel.defaultGoogleIcon);
    if(data) {
      var parsedData = {};
      if(data.totalItems === 0) {
        setAlert('No books found with ISBN = ' + self.itemNode().nodeInfo()['ISBN'](), 'alert-danger');
      } else {
        if('title' in data.items[0].volumeInfo) {
          parsedData['name'] = data.items[0].volumeInfo.title;
        }
        if('description' in data.items[0].volumeInfo) {
          parsedData['description'] = data.items[0].volumeInfo.description;
        }
        if('publisher' in data.items[0].volumeInfo) {
          parsedData['publisher'] = data.items[0].volumeInfo.publisher;
        }
        if('publishedDate' in data.items[0].volumeInfo) {
          parsedData['publishedDate'] = data.items[0].volumeInfo.publishedDate;
        }
        if('pageCount' in data.items[0].volumeInfo) {
          parsedData['pageCount'] = data.items[0].volumeInfo.pageCount;
        }
        if('industryIdentifiers' in data.items[0].volumeInfo) {
          parsedIsbn = null
          if(data.items[0].volumeInfo.industryIdentifiers.length >= 1) {
            if(data.items[0].volumeInfo.industryIdentifiers.length >= 2) {
              data.items[0].volumeInfo.industryIdentifiers.forEach(function(ident) {
                if(ident.type === 'ISBN_13') {
                  parsedIsbn = ident.identifier;
                } else if(!parsedIsbn && ident.type === 'ISBN_10') {
                  parsedIsbn = ident.identifier;
                }
              })
            } else {
              parsedIsbn = data.items[0].volumeInfo.industryIdentifiers[0].identifier;
            }
          }
          if(parsedIsbn) {
            parsedData['ISBN'] = parsedIsbn;
          }
        }
        if('infoLink' in data.items[0].volumeInfo) {
          parsedData['googleLink'] = data.items[0].volumeInfo.infoLink;
        }
        self.itemNode().updateNodeInfoData(parsedData);
        setAlert('Filled information from books.google.com', 'alert-success');
      }
    }
  })
}

EditItemNodeModel.prototype.setDateTriedItem = function() {
  var self = this;
  if(self.itemNode()) {
    self.itemNode().setDateTried();
  }
}

EditItemNodeModel.prototype.setDateReviewedItem = function() {
  var self = this;
  if(self.itemNode()) {
    self.itemNode().setDateReviewed();
  }
}

EditItemNodeModel.prototype.editItemImage = function() {
  var self = this;
  console.log('Display edit item image dialog');
}

EditItemNodeModel.prototype.proceedWithEditItemLink = function(itemLink) {
  var self = this;
  self.itemNode().nodeInfo()[nodesViewModel.nodeInfo6Key()](itemLink);
}

EditItemNodeModel.prototype.saveItem = function() {
  var self = this;
  self.setDateReviewedItem();
  self.setDateTriedItem();
  var url = self.itemNode().uri().replace('http://', 'https://');
  if(self.itemNode().uri() === '') {
    // add a new node
    setAlert('','','#editItemNodeAlertBox');
    return nodesViewModel.addNode(self.itemNode().nonNullData(), '#editItemNodeAlertBox');
  }
  var saveData = self.itemNode().sanitize();
  nodesViewModel.itemSaveIcon(nodesViewModel.defaultSpinnerIcon);
  setAlert('','','#editItemNodeAlertBox');
  $("html").addClass("waiting");
  nodesViewModel.ajax('PUT', url, alertIds.editItemNode, nodesViewModel.authHeader, saveData)
  .then(function(response) {
    nodesViewModel.itemSaveIcon(nodesViewModel.defaultItemSaveIcon);
    $("html").removeClass("waiting");
    if(response) {
      nodesViewModel.selectedItem().updateData(self.itemNode().data());;
      setAlert('Successfully Updated "' + nodesViewModel.selectedItem().name() +'"', 'alert-success');
      nodesViewModel.loadItem();
      $("#editItemNode").modal("hide");
    }
  });
}

EditItemNodeModel.prototype.proceedWithItemNodeEdit = function(nodeData = {}) {
  // add a main or sub node
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/node/' + self.subNode().id();
  $("html").addClass("waiting");
  nodesViewModel.ajax('PUT', url, alertIds.editItemNode, nodesViewModel.authHeader, nodeDate)
  .then(function(node) {
    $("html").removeClass("waiting");
    if(node) {
      self.selectedSubNode().name(node.name);
      self.selectedSubNode().description(node.description);
      $('a[mt-data-id="' + self.selectedSubNode().id() + '"] span.mt-tooltip').tooltip('dispose');
      $('a[mt-data-id="' + self.selectedSubNode().id() + '"] span.mt-tooltip').tooltip('enable');
      setAlert('Successfully Edited "' + node.name +'"', 'alert-success');
      self.selectedMainNode().children.sort(self.sortByIndexOrPubDateOrName);
    }
  });
}

EditItemNodeModel.prototype.beginEditItemLink = function() {
  var self = this;
  editItemLinkModel.itemLink(self.itemNode().nodeInfo()[nodesViewModel.nodeInfo6Key()]());
  $('#editItemLink').modal({show: true, backdrop: 'static'});
}


var LoginModel = function() {
  var self = this;
  self.username = ko.observable();
  self.password = ko.observable();
  self.types = ko.observableArray([]);
  self.type = ko.observable();
  self.context = null;
}

LoginModel.prototype.login = function() {
  var self = this;
  var username = self.username();
  var password = self.password();
  var type = $('#inputType').val();
  var context = self.context;
  self.password('');
  self.context = null;
  nodesViewModel.login(username, password, type)
  .then(function(data) {
    if(data) {
      nodesViewModel.currentUser(username);
      nodesViewModel.currentUserPassword = password;
      nodesViewModel.currentUserId = data.id;
      nodesViewModel.loggedIn(true);
      nodesViewModel.authHeader = {'Authorization':'Basic ' + btoa(nodesViewModel.currentUser() + ':' + nodesViewModel.currentUserPassword)};
    }
    return data;
  })
  .then(function(data) {
    if(data) {
      if(nodesViewModel.loggedIn()) {
        nodesViewModel.unloadItem();
        nodesViewModel.type(type);
        $('#login').modal('hide');
        self.username('');
        self.types([]);
        nodesViewModel.context.redirect('#/'+type+'?prev='+encodeURIComponent(nodesViewModel.context.path.split('?')[0]))
      } else {
        $('html').removeClass('waiting');
        nodesViewModel.context.redirect('#/login');
      }
    }
  });
}

var ViewTextModel = function() {
  var self = this;
  self.name = ko.observable()
  self.text = ko.observable();
  self.header = ko.observable();
}

ViewTextModel.prototype.cancel = function() {
  var self = this;
  self.name('');
  self.text('');
  self.header('');
}

var handleHideMainCollapse = function (e) {
  if ($(this).is(e.target)) {
    // if a main collapse occurs, make sure the sub divs collapse as well
    // and that the sub and items go inactive
    var mainNode = $('a[data-target="#' + $(this).attr('id') + '"]');
    $('a.mt-sub-a, a.mt-item-a').removeClass('active');
    nodesViewModel.unloadItem();
    // switch collapse icon to '+'
    nodesViewModel.findNode(mainNode.attr('mt-data-id')).collapsed(true);
  }
}

var handleHideSubCollapse = function (e) {
  if ($(this).is(e.target)) {
    // if a sub collapse occurs, make sure the items go inactive
    var subNode = $('a[data-target="#' + $(this).attr('id') + '"]');
    $('a.mt-item-a').removeClass('active');
    nodesViewModel.unloadItem();
    // switch collapse icon to '+'
    nodesViewModel.findNode(subNode.attr('mt-data-id')).collapsed(true);
  }
}

var handleShowMainCollapse = function (e) {
  if ($(this).is(e.target)) {
    var mainNode = $('a[data-target="#' + $(this).attr('id') + '"]');
    // switch collapse icon to '-'
    nodesViewModel.findNode(mainNode.attr('mt-data-id')).collapsed(false);
  }
}

var handleShowSubCollapse = function (e) {
  if ($(this).is(e.target)) {
    var subNode = $('a[data-target="#' + $(this).attr('id') + '"]');
    // switch collapse icon to '-'
    nodesViewModel.findNode(subNode.attr('mt-data-id')).collapsed(false);
  }
}

var scrollToSelectedMainNode = function() {
  var accordianMain = $('#accordianMain');
  var containerScrollTop = accordianMain.scrollTop();
  var containerOffsetTop = accordianMain.offset().top;
  var mainNode = $('a[mt-data-id="' + nodesViewModel.selectedMainNode().id() + '"]');
  var selectionOffsetTop = mainNode.offset().top;
  accordianMain.animate({
     scrollTop: containerScrollTop+selectionOffsetTop-containerOffsetTop},
     function() {
       $(mainNode.attr('data-target')).off('shown.bs.collapse', scrollToSelectedMainNode);
     });

}

var scrollToSelectedSubNode = function() {
  var accordianMain = $('#accordianMain');
  var containerScrollTop = accordianMain.scrollTop();
  var containerOffsetTop = accordianMain.offset().top;
  var subNode = $('a[mt-data-id="' + nodesViewModel.selectedSubNode().id() + '"]');
  var selectionOffsetTop = subNode.offset().top;
  accordianMain.animate({
     scrollTop: containerScrollTop+selectionOffsetTop-containerOffsetTop});
}

var scrollToSelectedItem = function() {
  var accordianMain = $('#accordianMain');
  var containerScrollTop = accordianMain.scrollTop();
  var containerOffsetTop = accordianMain.offset().top;
  var containerHeight = accordianMain.height();
  var itemNode = $('a[mt-data-id="' + nodesViewModel.selectedItem().id() + '"]');
  var selectionOffsetTop = itemNode.offset().top;
  if(selectionOffsetTop > containerOffsetTop + containerHeight || selectionOffsetTop < containerOffsetTop) {
    accordianMain.animate({
       scrollTop: containerScrollTop+selectionOffsetTop-containerOffsetTop-containerHeight/2});
  }
}

var scrollToNode = function(node) {
  if(node) {
    var accordianMain = $('#accordianMain');
    var containerScrollTop = accordianMain.scrollTop();
    var containerOffsetTop = accordianMain.offset().top;
    var containerHeight = parseInt(accordianMain.css('height').replace('px',''));
    var itemNode = $('a[mt-data-id="' + node.id() + '"]');
    var selectionOffsetTop = itemNode.offset().top;
    var selectionHeight = parseInt(itemNode.css('height').replace('px',''));
    // Place top of selection at top of scroll container
    // scrollTop = containerScrollTop + selectionOffsetTop - containerOffsetTop
    // Place bottom of selection at top of scroll container
    // scrollTop = containerScrollTop + selectionOffsetTop + selectionHeight - containerOffsetTop
    // Place bottom of selection at bottom of scroll container
    // scrollTop = containerScrollTop + selectionOffsetTop + selectionHeight - containerOffsetTop - containerHeight
    // Place middle of selection in middle of scroll container
    // scrollTop = containerScrollTop + selectionOffsetTop + selectionHeight/2 - containerOffsetTop - containerHeight/2
    if(selectionOffsetTop < containerOffsetTop || selectionOffsetTop > containerHeight + containerOffsetTop - selectionHeight)  {
      accordianMain.animate({
         scrollTop: containerScrollTop + selectionOffsetTop + selectionHeight/2 - containerOffsetTop - containerHeight/2});
    }
  }
}

var showMainCollapse = function() {
  if(nodesViewModel.selectedMainNode()) {
    var mainNode = $('a[mt-data-id="' + nodesViewModel.selectedMainNode().id() + '"]');
    $(mainNode.attr('data-target')).collapse('show');
  }
}

var hideMainCollapse = function() {
  if(nodesViewModel.selectedMainNode()) {
    var mainNode = $('a[mt-data-id="' + nodesViewModel.selectedMainNode().id() + '"]');
    $(mainNode.attr('data-target')).collapse('hide');
  }
}

var showSubCollapse = function() {
  if(nodesViewModel.selectedSubNode()) {
    var subNode = $('a[mt-data-id="' + nodesViewModel.selectedSubNode().id() + '"]');
    $(subNode.attr('data-target')).collapse('show');
  }
}

var hideSubCollapse = function() {
  if(nodesViewModel.selectedSubNode()) {
    var subNode = $('a[mt-data-id="' + nodesViewModel.selectedSubNode().id() + '"]');
    $(subNode.attr('data-target')).collapse('hide');
  }
}

var handleMainClick =  function(mainNode) {
  if(nodesViewModel.selectedMainNode() && nodesViewModel.selectedMainNode().id() == mainNode.id()) {
    //if this is a re-click of a main node
    $('#accordianCollapse_' + mainNode.id()).collapse('toggle');
    $('a.mt-sub-a, a.mt-item-a').removeClass('active');
    nodesViewModel.selectedMainNode().collapsed(!nodesViewModel.selectedMainNode().collapsed());
    if(nodesViewModel.selectedSubNode()) {
      $('#accordianCollapse_' + nodesViewModel.selectedSubNode().id()).collapse('hide');
    }
    nodesViewModel.selectedSubNode(null);
    nodesViewModel.selectedItem(null);
    nodesViewModel.unloadItem();
  } else {
    // this is a first click of a main node
    $('a.mt-main-a, a.mt-sub-a, a.mt-item-a').removeClass('active');
    $('a[mt-data-id='+ mainNode.id()+']').addClass('active');
    var oldMainNode = nodesViewModel.selectedMainNode();
    nodesViewModel.selectedMainNode(nodesViewModel.findNode(mainNode.id()));
    if(oldMainNode && oldMainNode.id() !== mainNode.id()) {
      oldMainNode.collapsed(true);
    }
    // let any previously selected main node rid itself of children before proceeding
    var promise;
    if(oldMainNode && oldMainNode.id() !== mainNode.id()) {
      promise = new Promise(function(resolve, reject) {
        resolve(oldMainNode.children([]));
      });
    } else {
      promise = new Promise(function(resolve, reject) {
        resolve(true);
      });
    }
    return promise
    .then(function() {
      nodesViewModel.selectedSubNode(null);
      nodesViewModel.selectedItem(null)
      Promise.resolve(nodesViewModel.selectedMainNode().children(mainNode.children()))
    })
    .then(function() {
      // the subnodes for this clicked main node have been populated and made visible
      var mainNodeId = nodesViewModel.selectedMainNode().id();
      $("div#accordianCollapse_" + mainNodeId + " i.fa, div#accordianCollapse_" + mainNodeId + " i.far").css({'visibility':'visible'});
      $('#accordian_' + mainNodeId + ' [data-toggle="tooltip"]').tooltip('enable');
      $("html").removeClass("waiting");
      $('#accordianCollapse_' + mainNodeId).off('hidden.bs.collapse');
      $('#accordianCollapse_' + mainNodeId).on('hidden.bs.collapse', function(e) {
        if ($(this).is(e.target)) {
          nodesViewModel.selectedMainNode().collapsed(true);
          scrollToNode(nodesViewModel.selectedMainNode());
        }
      });
      $('#accordianCollapse_' + mainNodeId).off('shown.bs.collapse');
      $('#accordianCollapse_' + mainNodeId).on('shown.bs.collapse', function(e) {
        if ($(this).is(e.target)) {
          nodesViewModel.selectedMainNode().collapsed(false);
          scrollToNode(nodesViewModel.selectedMainNode());
        }
      });
      $("a[mt-data-id=" + mainNodeId + "]").off('click', toggleCollapse);
      $("a[mt-data-id=" + mainNodeId + "]").on('click', toggleCollapse);
      $('#accordianCollapse_' + mainNodeId).collapse('show');
      nodesViewModel.filterItems([]);
      nodesViewModel.sortedItems([]);
      nodesViewModel.unloadItem();
    })
  }
}

var handleSubClick = function(mainNode, subNode, scroll=true) {
  if(!nodesViewModel.selectedMainNode()) {
    // no main node selected yet, select it and expand it
    nodesViewModel.selectedMainNode(nodesViewModel.findNode(mainNode.id()));
    $('a.mt-main-a, a.mt-sub-a, a.mt-item-a').removeClass('active');
    $('a[mt-data-id='+ mainNode.id()+']').addClass('active');
    $('#accordianCollapse_' + mainNode.id()).collapse('show');
    nodesViewModel.selectedMainNode().collapsed(false);
  }
  if(nodesViewModel.selectedMainNode().id() == mainNode.id()) {
    // if the main node is already selected, make sure it is expanded
    $('a[mt-data-id='+ mainNode.id()+']').addClass('active');
    $('#accordianCollapse_' + mainNode.id()).collapse('show');
    nodesViewModel.selectedMainNode().collapsed(false);
  } else {
    // if a different main node is selected, select it and expand it
    nodesViewModel.selectedMainNode().children([]);
    nodesViewModel.selectedMainNode(nodesViewModel.findNode(mainNode.id()));
    $('a.mt-main-a, a.mt-sub-a, a.mt-item-a').removeClass('active');
    $('a[mt-data-id='+ mainNode.id()+']').addClass('active');
    $('#accordianCollapse_' + mainNode.id()).collapse('show');
  }
  return Promise.resolve(nodesViewModel.selectedMainNode().children(mainNode.children()))
  .then(function() {
    // select the subnode and expand it
    nodesViewModel.selectedSubNode(nodesViewModel.findNode(subNode.id()));
    nodesViewModel.selectedSubNode().children.sort(nodesViewModel.sortByIndexOrPubDateOrName);
    $('a.mt-sub-a, a.mt-item-a').removeClass('active');
    $('a[mt-data-id='+ subNode.id()+']').addClass('active');
    $('#accordianCollapse_' + subNode.id()).collapse('show');
    nodesViewModel.selectedSubNode().collapsed(false);
    $("div#accordianCollapse_" + subNode.id() + " i.fa, div#accordianCollapse_" + subNode.id() + " i.far").css({'visibility':'visible'});
    $('#accordianCollapse_' + subNode.id()).off('hidden.bs.collapse');
    $('#accordianCollapse_' + subNode.id()).on('hidden.bs.collapse', function(e) {
      if ($(this).is(e.target)) {
        subNode.collapsed(true);
      }
    });
    $('#accordianCollapse_' + subNode.id()).off('shown.bs.collapse');
    $('#accordianCollapse_' + subNode.id()).on('shown.bs.collapse', function(e) {
      if ($(this).is(e.target)) {
        subNode.collapsed(false);
      }
    });
    $("a[mt-data-id=" + subNode.id() + "]").off('click', toggleCollapse);
    $("a[mt-data-id=" + subNode.id() + "]").on('click', toggleCollapse);
    $('#accordianCollapse_' + subNode.id()).collapse('show');
    $('a.mt-item-a').removeClass('active');
    nodesViewModel.selectedItem(null);
    nodesViewModel.unloadItem();
  })
  .then(function() {
    if(scroll) {
      scrollToNode(subNode);
    }
  });
}

var handleItemClick = function(mainNode, subNode, itemNode) {
  return handleSubClick(mainNode, subNode, scroll=false)
  .then(function() {
    $('a.mt-item-a').removeClass('active');
    $('a[mt-data-id='+ itemNode.id()+']').addClass('active');
    var node = nodesViewModel.findNode(itemNode.id());
    nodesViewModel.selectedItem(node);
    nodesViewModel.loadItem();
  })
  .then(function() {
    scrollToNode(itemNode);
  })
}

var initType = function() {
  var self = this;
  if(self.value !== nodesViewModel.type()) {
    nodesViewModel.unloadItem();
    nodesViewModel.context.redirect('#/' + $('#typesSelect').val()+'?prev='+encodeURIComponent(nodesViewModel.context.path.split('?')[0]))
  }
}

var login = function(context) {
  var errorMessage = '';
  nodesViewModel.context = context;
  nodesViewModel.previousUser = nodesViewModel.currentUser();
  nodesViewModel.previousUserPassword = nodesViewModel.currentUserPassword;
  loginModel.types(nodesViewModel.types());
  loginModel.context = context;
  $('#login').modal({show: true,
                     backdrop: 'static'});
  Promise.resolve($.ajax({
    cache: false,
    url: "my_things/.secrets.json",
    dataType: "json",
    timeout: 5000
  }))
  .catch(function(err) {
    $("html").removeClass("waiting");
    errorMessage = err.state();
    if(errorMessage === 'rejected') {
      errorMessage = 'Possible network issue. Please try again later.';
    }
    setAlert('error getting secrets file: ' + errorMessage, 'alert-danger','#loginAlertBox');
  })
  .then(function(jsonSecrets) {
    $("html").removeClass("waiting");
    secrets = jsonSecrets;
  })
 .then(function(response) {
   return checkServer(secrets['MY_THINGS_SERVER']);
 })
 .catch(function(err) {
   $("html").removeClass("waiting");
   if(err.status === 0) {
     errorMessage = 'Possible network issue. Please try again later.';
     setAlert('Error contacting remote server ' + secrets['MY_THINGS_SERVER'] + ': ' + errorMessage, 'alert-danger','#loginAlertBox');
   }
 })
}

var logout = function(context) {
  nodesViewModel.context = context;
  nodesViewModel.logout();
  nodesViewModel.context.redirect('#/login');

}

var setType = function(context) {
  var prevPath = nodesViewModel.context.path.split('?')[0];
  nodesViewModel.context = context;
  var errorMessage = '';
  if('errorMessage' in nodesViewModel.context.params) {
    errorMessage = nodesViewModel.context.params.errorMessage + ' attempting to redirect to ' + prevPath;
  }
  if(!nodesViewModel.loggedIn()) {
    nodesViewModel.context.redirect('#/login');
  }
  nodesViewModel.type(context.params['type']);
  nodesViewModel.filterText('');
  nodesViewModel.selectedItem(null);
  nodesViewModel.unloadItem();
  nodesViewModel.selectedSubNode(null);
  nodesViewModel.selectedMainNode(null);
  nodesViewModel.setType(errorMessage)
  .then(function(data) {
    if(!data && 'prev' in nodesViewModel.context.params && nodesViewModel.context.params.prev.includes('login')) {
      // error encountered
      setAlert(lastAjaxError,'alert-danger',alertIds.login);
      nodesViewModel.context.redirect('#/login');
    } else if(!data && 'prev' in nodesViewModel.context.params) {
      setAlert(lastAjaxError,'alert-danger',alertIds.main);

      nodesViewModel.context.redirect(nodesViewModel.context.params.prev+'?errorMessage='+encodeURIComponent(lastAjaxError));
    } else {
      if('next' in nodesViewModel.context.params) {
        url += '?next=' + encodeURIComponent(context.params.next);
        if('errorMessage' in context.params) {
          url += '&errorMessage=' + encodeURIComponent(context.params.errorMessage);
        }
        context.params.redirect(url);
      }
      $('#itemDetailsTab').tab('show');
    }
  });
}

var selectNode = function(context) {
  nodesViewModel.context = context;
  var type = context.params['type'];
  var nodeId = context.params['nodeid'];
  if(type !== nodesViewModel.type()) {
    //switch to a different type, then select this node
    var url = '#/' + type + '?next=' + encodeURIComponent('#/' + type + '/' + nodeId)
    nodesViewModel.context.redirect(url)
  }
  node = nodesViewModel.findNode(nodeId);
  var nodeTreePresent = node !== null;
  if(nodesViewModel.isMain(node)) {
    // This is a main node. Check to see if the node tree is present. if so, don't hit the database
    nodeTreePresent = node.children().length > 0;
  }
  if(!nodeTreePresent) {
    nodesViewModel.getMainSubtree(nodeId)
    .then(function(response) {
      if(response) {
        handleNode(response);
      }
    });
  } else {
    // get the node tree associated with this node
    var mainNode = nodesViewModel.getTree(node);
    handleNode(mainNode);
  }

}

var handleNode = function(mainNode) {
  var type = nodesViewModel.context.params['type'];
  var nodeId = nodesViewModel.context.params['nodeid'];
  var toggleNeed = false;
  if('toggleNeed' in nodesViewModel.context.params) {
    toggleNeed = true;
  }
  $("html").removeClass("waiting");
  // the node tree has been populated
  if(mainNode.id() == nodeId) {
    // this was a main node
    handleMainClick(mainNode);
  } else {
    mainNode.children().some(function(subNode) {
      if(subNode.id() == nodeId) {
        // this was a sub node
        // if it is a subnode of the currently selecte mainNode, just select it and show it
        handleSubClick(mainNode,subNode);
        return true;
      } else {
        subNode.children().some(function(itemNode) {
          if(itemNode.id() == nodeId) {
            // this was an item node
            // if it is an item node of the currently selected main and sub nodes, just select it and show it
            handleItemClick(mainNode,subNode,itemNode)
            .then(function() {
              if(toggleNeed) {
                nodesViewModel.toggleItemNeed()
                .then(function() {
                  self.context.redirect('#/'+self.type()+'/'+self.selectedItem().id());
                })
              }
            })
            return true;
          }
          return false; // check the next item
        });
      }
      return false // check the next sub
    });
    $('#itemDetailsTab').tab('show');
  }
}

var toggleCollapse = function(e) {
  if ($(this).is(e.currentTarget)) {
    targetNode = nodesViewModel.findNode($(this).attr('mt-data-id'));
    $('#accordianCollapse_' + $(this).attr('mt-data-id')).collapse('toggle');
  }
}

var displayDate = function(date=null) {
  var dateString = '';
  if(date) {
    dateObject = new Date(date);
    dateString = ('0'+((dateObject.getMonth()+1))).substr(-2,2)+'/'+('0'+dateObject.getDate()).substr(-2,2)+'/'+('0'+dateObject.getFullYear()).substr(-2,2);
  }
  return dateString;
}

var checkServer = function(url) {
  return Promise.resolve($.ajax({url: url,
          type: "HEAD",
          timeout:1000
   })
 )
}

nodesViewModel = new NodesViewModel();
addMainNodeModel = new AddMainNodeModel();
addSubNodeModel = new AddSubNodeModel();
editMainNodeModel = new EditMainNodeModel();
editSubNodeModel = new EditSubNodeModel();
editItemNodeModel = new EditItemNodeModel();
viewTextModel = new ViewTextModel();
loginModel = new LoginModel();
ko.options.deferUpdates = true;
ko.applyBindings(nodesViewModel, $('#mainBody')[0]);
ko.applyBindings(addMainNodeModel, $('#addMainNode')[0]);
ko.applyBindings(addSubNodeModel, $('#addSubNode')[0]);
ko.applyBindings(editMainNodeModel, $('#editMainNode')[0]);
ko.applyBindings(editSubNodeModel, $('#editSubNode')[0]);
ko.applyBindings(editItemNodeModel, $('#editItemNode')[0]);
ko.applyBindings(viewTextModel, $('#viewText')[0]);
ko.applyBindings(loginModel, $('#login')[0]);
ko.applyBindings(nodesViewModel, $('#loadingDialog')[0]);
setDefaultAlert('');

var app = $.sammy('#mainBody', function() {
  var self = this;
  self.debug = true;
  self.get('#/', function() {
    nodesViewModel.context = this;
    nodesViewModel.context.redirect('#/books');
  });
  self.get('#/login', login);
  self.get('#/logout', logout);
  self.get('#/:type', setType);
  self.get('#/:type/:nodeid', selectNode);
});

$('#typesSelect').on('keyup mouseup', initType);
$('#itemNodeTried').on('change', editItemNodeModel.setDateTriedItem.bind(editItemNodeModel));
$('#sortControls input').on('change', function(e)
  {nodesViewModel.sortList()}
);
$(document).keypress(function(e) {
  if(e.which == 13) {
    if(document.activeElement.id === 'itemNodeInfo4' && nodesViewModel.nodeInfo4Key() === 'ISBN') {
      // ISBN
      e.preventDefault();
      editItemNodeModel.fillItemFromGoogle();
    } else if($("#searchTab").hasClass("show")) {
      nodesViewModel.filter();
    } else {
      if($('.modal-open').length) {
        e.preventDefault();
        $('.modal.show').find('button.btn-primary').click();
      }
    }
  }
});
$('#filterPerPage a').on('click', function(e) {
  var filterPerPage = $(this).text();
  if(filterPerPage == "All") {
    filterPerPage = '-1';
  }
  $('#filterPerPage a').removeClass('font-weight-bold');
  Promise.resolve(nodesViewModel.filterPerPage(filterPerPage))
  .then(function() {
    nodesViewModel.filter();
  });
});
$('#filterNavArrows i').on('click', function(e) {
  if(e.target.id == 'filterNavPrevPage' && nodesViewModel.filterPrevPage()) {
    nodesViewModel.filter(page=nodesViewModel.filterPrevPage());
  } else if(e.target.id == 'filterNavFirstPage') {
    nodesViewModel.filter(page=1);
  } else if(e.target.id == 'filterNavNextPage' && nodesViewModel.filterNextPage()) {
    nodesViewModel.filter(page=nodesViewModel.filterNextPage());
  } else if(e.target.id == 'filterNavLastPage' && nodesViewModel.filterPages()) {
    nodesViewModel.filter(page=nodesViewModel.filterPages());
  }
});
$('#sortPerPage a').on('click', function(e) {
  var sortPerPage = $(this).text();
  if(sortPerPage == "All") {
    sortPerPage = '-1';
  }
  $('#sortPerPage a').removeClass('font-weight-bold');
  Promise.resolve(nodesViewModel.sortPerPage(sortPerPage))
  .then(function() {
    nodesViewModel.sortList();
  });
});
$('#sortNavArrows i').on('click', function(e) {
  if(e.target.id == 'sortNavPrevPage' && nodesViewModel.sortPrevPage()) {
    nodesViewModel.sortList(page=nodesViewModel.sortPrevPage());
  } else if(e.target.id == 'sortNavFirstPage') {
    nodesViewModel.sortList(page=1);
  } else if(e.target.id == 'sortNavNextPage' && nodesViewModel.sortNextPage()) {
    nodesViewModel.sortList(page=nodesViewModel.sortNextPage());
  } else if(e.target.id == 'sortNavLastPage' && nodesViewModel.sortPages()) {
    nodesViewModel.sortList(page=nodesViewModel.sortPages());
  }
});
$('#login').on('shown.bs.modal', function () {
  $('#inputUsername').trigger('focus');
});
$('#editMainNode').on('shown.bs.modal', function () {
  $('#editMainNodeName').trigger('focus');
});
$('#editSubNode').on('shown.bs.modal', function () {
  $('#editSubNodeName').trigger('focus');
});
$('#editItemNode').on('shown.bs.modal', function () {
  editItemNodeModel.updateItemEditTooltips();
  $('#itemNodeName').trigger('focus');
});
$('#addMainNode').on('shown.bs.modal', function () {
  $('#inputMainNodeName').trigger('focus');
});
$('#addSubNode').on('shown.bs.modal', function () {
  $('#inputSubNodeName').trigger('focus');
});
$("html").addClass("waiting");
$(document).ready(function() {
  app.run('#/login');
})
