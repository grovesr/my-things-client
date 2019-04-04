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

$('.fa, .far').css({'visibility':'hidden'});
$('.mt-add-buttons, .mt-edit-buttons, .mt-item-form, .nav-item, .nav-link').css({'visibility':'hidden'});
$('#itemSortIndex').addClass("d-none");

function setDefaultAlert() {
  var alerts = $('.alert');
  Object.keys(alerts).forEach(function(indx) {
    setAlert(nodesViewModel.defaultAlert(),'','#'+alerts[indx].id);
  });
}

function setAlert(alertText='', alertClass = '', alertId='#alertBox') {
  $('html').off('click', setDefaultAlert);
  if(alertClass !== '') {
    $('html').on('click', setDefaultAlert);
  }
  if(alertText === '') {
    alertText = '&nbsp;';
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

var Node = function(initialize=true, data={}) {
  var self = this;
  if(initialize) {
    self.children = ko.observableArray([]);
    self.collapsed = ko.observable(true);
    self.visible = ko.observable(true);
  }
  self.forgettableAspects = ['children', 'collapsed', 'forgettableAspects',
                             'changed', 'nodeTooltip', 'nodeviewTooltip',
                             'nodeReviewTooltip','leavesNeeded'];
  if(data) {
    self.loadData(data);
  }

  if(initialize) {
    self.nodeDescriptionTooltip = ko.pureComputed(function() {
      return (self.description() ? self.description() : '');
    });
    self.nodeReviewTooltip = ko.pureComputed(function() {
      return (self.review() ? self.review() : '');
    });
    self.leavesNeeded = ko.pureComputed(function() {
      var needed = 0;
      var leaves = self.findLeaves();
      for(var indx=0; indx<leaves.length; indx++) {
        if(leaves[indx].need()) {
          needed++;
        }
      }
      return needed;
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

Node.prototype.toggleNeed = function() {
  var self = this;
  self.need(!self.need());
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

Node.prototype.findLeaves = function(leaves = []) {
  var self = this;
  if(self.children().length === 0) {
    return leaves.push(self);
  }
  self.children().forEach(function(child) {
    leaves.concat(child.findLeaves(leaves));
  })
  return leaves;
}

Node.prototype.numLeavesHaveTried = function() {
  var self = this;
  var leaves = self.findLeaves();
  var count = 0;
  for(var indx=0; indx<leaves.length; indx++) {
    if(leaves[indx].haveTried()) {
      count++;
    }
  }
  return count;
}

Node.prototype.leavesHaveTried = function() {
  var self = this;
  var leaves = self.findLeaves();
  for(var indx=0; indx<leaves.length; indx++) {
    if(leaves[indx].haveTried()) {
      return true;
    }
  }
  return false;
}

Node.prototype.allLeavesHaveTried = function() {
  var self = this;
  var leaves = self.findLeaves();
  for(var indx=0; indx<leaves.length; indx++) {
    if(!leaves[indx].haveTried()) {
      return false;
    }
  }
  return true;
}

Node.prototype.leavesHaveReviewed = function() {
  var self = this;
  var leaves = self.findLeaves();
  for(var indx=0; indx<leaves.length; indx++) {
    if(leaves[indx].review()) {
      return true;
    }
  }
  return false;
}

Node.prototype.leavesHaveRating = function() {
  var self = this;
  var leaves = self.findLeaves();
  for(var indx=0; indx<leaves.length; indx++) {
    if(leaves[indx].rating() !== null && leaves[indx].rating() !== '') {
      return true;
    }
  }
  return false;
}

Node.prototype.averageRating = function() {
  var self = this;
  var numRated = 0;
  var sumRating = 0;
  var leaves = self.findLeaves();
  for(var indx=0; indx<leaves.length; indx++) {
    if(leaves[indx].rating() !== null && leaves[indx].rating() !== '') {
      numRated++;
      sumRating += Math.floor(leaves[indx].rating());
    }
  }
  if(numRated === 0) {
    return null;
  } else {
    return Math.round(sumRating / numRated);
  }
}

Node.prototype.loadData = function(data) {
  var self = this;
  Object.keys(data).forEach(function(aspect) {
    // dynamically set the Node's aspects based on the JSON data
    if(data[aspect] && typeof data[aspect] === 'object') {
      self[aspect] = ko.observable({});
      Object.keys(data[aspect]).forEach( function(nodeInfoAspect) {
        if(typeof nodeInfoAspect === 'array') {
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
  self.mainLabels = {'books':'Author',
                    'wine':'Winery',
                    'beer':'Brewery',
                    'spirits':'Distillery',
                    'campgrounds':'State',
                    'videos':'Genre',
                    'other':'Main'}
  self.subLabels = {'books':'Series',
                    'wine':'Type',
                    'beer':'Type',
                    'spirits':'Type',
                    'campgrounds':'Region',
                    'videos':'Series Name/non-series',
                    'other':'Sub'}
  self.itemLabels = {'books':'Book',
                    'wine':'Wine',
                    'beer':'Beer',
                    'spirits':'Spirit',
                    'campgrounds':'Campground',
                    'videos':'Season #/Title',
                    'other':'Item'}
  self.triedLabels = {'books':'Read',
                    'wine':'Tried',
                    'beer':'Tried',
                    'spirits':'Tried',
                    'campgrounds':'Camped',
                    'videos':'Viewed',
                    'other':'Tried'}
  self.sortIndexLabels = {'books':'Series Order',
                         'wine':'n/a',
                         'beer':'n/a',
                         'spirits':'n/a',
                         'campgrounds':'n/a',
                         'videos':'Series Order',
                         'other':'Sort Index'}
  self.nodeInfo1Keys = {'books':'publisher',
                        'wine':'vintage',
                        'beer':'vintage',
                        'spirits':'vintage',
                        'campgrounds':'type',
                        'videos':'provider',
                        'other':'nodeinfo1'}
  self.nodeInfo2Keys = {'books':'publishedDate',
                        'wine':'region',
                        'beer':'region',
                        'spirits':'region',
                        'campgrounds':'dates',
                        'videos':'aired',
                        'other':'nodeinfo2'}
  self.nodeInfo3Keys = {'books':'pageCount',
                        'wine':'ABV',
                        'beer':'ABV',
                        'spirits':'ABV',
                        'campgrounds':'amenities',
                        'videos':'epsiodes',
                        'other':'nodeinfo3'}
  self.nodeInfo4Keys = {'books':'ISBN',
                        'wine':'taste',
                        'beer':'IBU',
                        'spirits':'taste',
                        'campgrounds':'sites',
                        'videos':'length',
                        'other':'nodeinfo4'}
  self.nodeInfo5Keys = {'books':'ASIN',
                        'wine':'color',
                        'beer':'SRM',
                        'spirits':'color',
                        'campgrounds':'cost',
                        'videos':'actors',
                        'other':'nodeinfo5'}
  self.nodeInfo6Keys = {'books':'googleLink',
                        'wine':'link',
                        'beer':'link',
                        'spirits':'link',
                        'campgrounds':'link',
                        'videos':'link',
                        'other':'nodeinfo6'}
  self.nodeInfo1Labels = {'books':'Publisher',
                        'wine':'Vintage',
                        'beer':'Vintage',
                        'spirits':'Vintage',
                        'campgrounds':'Type',
                        'videos':'Provider',
                        'other':'Node Info 1'}
  self.nodeInfo2Labels = {'books':'Published',
                        'wine':'Region',
                        'beer':'Region',
                        'spirits':'Region',
                        'campgrounds':'Dates Open',
                        'videos':'First Aired',
                        'other':'Node Info 2'}
  self.nodeInfo3Labels = {'books':'Pages',
                        'wine':'ABV',
                        'beer':'ABV',
                        'spirits':'ABV',
                        'campgrounds':'Amenities',
                        'videos':'# Episodes',
                        'other':'Node Info 3'}
  self.nodeInfo4Labels = {'books':'ISBN',
                        'wine':'Taste',
                        'beer':'IBU',
                        'spirits':'Taste',
                        'campgrounds':'Site details',
                        'videos':'Avg. Length',
                        'other':'Node Info 4'}
  self.nodeInfo5Labels = {'books':'ASIN',
                        'wine':'Color',
                        'beer':'SRM',
                        'spirits':'Color',
                        'campgrounds':'Cost',
                        'videos':'Actors',
                        'other':'Node Info 5'}
  self.nodeInfo6Labels = {'books':'Link',
                        'wine':'Link',
                        'beer':'Link',
                        'spirits':'Link',
                        'campgrounds':'Link',
                        'videos':'Link',
                        'other':'Node Info 6'}
  self.defaultGoogleIcon = 'G';
  self.defaultItemSaveIcon = 'Save';
  self.defaultItemDeleteIcon = 'Delete';
  self.defaultItemEditIcon = 'Edit'
  self.defaultSpinnerIcon = '<i class="fa fa-spinner fa-spin"></i>';
  self.fillItemFromGoogleIcon = ko.observable(self.defaultGoogleIcon);
  self.itemSaveIcon = ko.observable(self.defaultItemSaveIcon);
  self.itemDeleteIcon = ko.observable(self.defaultItemDeleteIcon);
  self.itemEditIcon = ko.observable(self.defaultItemEditIcon);
  self.defaultAlert = ko.observable();
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
  self.defaultAlert = ko.observable();
  self.mainNodes = ko.observableArray();
  self.selectedMainNode = ko.observable(null);
  self.selectedSubNode = ko.observable(null);
  self.selectedItem = ko.observable(null);
  self.filterText = ko.observable('');
  self.previousSelectedItem = null;
  self.rootNode = null;
  self.adjacencyList = {};
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
  self.filterItems = ko.computed(function() {
    var filter = self.filterText();
    if(self.rootNode && filter !== '') {
  		var tempList = self.rootNode.children().slice();
  		return tempList.filter(function(node) {
  			return node.name().match(new RegExp(filter,'ig')) !== null;
  		});
    } else {
      return [];
    }
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

NodesViewModel.prototype.nodeHref = function(nodeId) {
  var self = this;
  var href = ''
  var node = self.findNode(nodeId);
  if(node !== null) {
    var href = node.id();
    var parentNode = self.findNode(node.parentId());
    while(parentNode) {
      href = parentNode.id() + '/' + href;
      var parentNode = self.findNode(parentNode.parentId());
    }
  }
  return '#/'+self.type()+'/'+href;
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
  setAlert('');
  var url = secrets['MY_THINGS_SERVER'] + '/admin/check/user/';
  url += encodeURIComponent(username);
  var authHeader = {'Authorization':'Basic ' + btoa(username + ':' + password)};
  self.loggedIn(true);
  return self.ajax('GET', url, {}, authHeader);
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
  self.loggedIn(false);
}

NodesViewModel.prototype.sortByIndexOrPubDateOrName = function (left, right) {

  if(left.sortIndex() !== null && right.sortIndex() !== null) {
    return (left.sortIndex() == right.sortIndex() ? 0 : (parseInt(left.sortIndex()) < parseInt(right.sortIndex()) ? -1 : 1));
  } else if('publishedDate' in left.nodeInfo() && 'publishedDate' in right.nodeInfo() &&
            left.nodeInfo()['publishedDate']() !== null && right.nodeInfo()['publishedDate']() !== null) {
    var dleft = new Date(left.nodeInfo()['publishedDate']());
    var dright = new Date(right.nodeInfo()['publishedDate']());
    return (dleft == dright ? 0 : (dleft < dright ? -1 : 1));
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

NodesViewModel.prototype.setType = function() {
  var self = this;
  self.setLabels();
  nodesViewModel.visible(false);
  $("html").addClass("waiting");
  $('#loadingDialog').modal('show');
  return nodesViewModel.getNodes()
  .then(function(response) {
    $("html").removeClass("waiting");
    // build adjacencyList structure
    self.adjacencyList = {};
    response.nodes.forEach(function(node) {
      if(!(node.parentId in self.adjacencyList)) {
        self.adjacencyList[node.parentId] = [];
      }
      var newNode = new Node(true, node);
      self.initNode(newNode);
      self.adjacencyList[node.parentId].push(newNode);
    });
    self.rootNode = self.buildNodeHierarchy();
    self.mainNodes(self.rootNode.children());
    $('.mt-main-collapse').on('hide.bs.collapse', handleHideMainCollapse);
    $('.mt-sub-collapse').on('hide.bs.collapse', handleHideSubCollapse);
    $('.mt-main-collapse').on('show.bs.collapse', handleShowMainCollapse);
    $('.mt-sub-collapse').on('show.bs.collapse', handleShowSubCollapse);
  })
  .then(function() {
    setDefaultAlert();
    $('.fa, .far').css({'visibility':'visible'});
    $('.mt-add-buttons, .nav-item, .nav-link').css({'visibility':'visible'});
    self.updateItemListTooltips();
    self.updateControlsTooltips();
    $('#loadingDialog').modal('hide');
    nodesViewModel.visible(true);
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    $('#loadingDialog').modal('hide');
    nodesViewModel.visible(true);
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.setType ajax call: ' + errorMessage, 'alert-danger')
    }
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
  self.ajax('DELETE', url, {}, self.authHeader)
  .then(function(response) {
    $("html").removeClass("waiting");
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
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.proceedWithMainNodeDelete ajax call: ' + errorMessage, 'alert-danger')
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
  self.ajax('DELETE', url, {}, self.authHeader)
  .then(function(response) {
    $("html").removeClass("waiting");
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
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.proceedWithSubNodeDelete ajax call: ' + errorMessage, 'alert-danger')
    }
  });
}

NodesViewModel.prototype.proceedWithItemDelete = function() {
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/node/';
  url += encodeURIComponent(self.selectedItem().id());
  self.itemDeleteIcon(self.defaultSpinnerIcon);
  self.ajax('DELETE', url, {}, self.authHeader)
  .then(function(response) {
    self.itemDeleteIcon(self.defaultItemDeleteIcon);
    $("html").removeClass("waiting");
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
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    self.itemDeleteIcon(self.defaultItemDeleteIcon);
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.proceedWithItemDelete ajax call: ' + errorMessage, 'alert-danger')
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
  self.ajax('PUT', url, nodeData, self.authHeader)
  .then(function(node) {
    $("html").removeClass("waiting");
    self.selectedMainNode().name(node.name);
    self.selectedMainNode().description(node.description);
    $('a[mt-data-id="' + self.selectedMainNode().id() + '"] span.mt-tooltip').tooltip('dispose');
    $('a[mt-data-id="' + self.selectedMainNode().id() + '"] span.mt-tooltip').tooltip('enable');
    setAlert('Successfully Edited "' + node.name +'"', 'alert-success');
    self.mainNodes.sort(self.sortByIndexOrPubDateOrName);
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.proceedWithMainNodeEdit ajax call: ' + errorMessage, 'alert-danger')
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
  self.ajax('PUT', url, nodeData, self.authHeader)
  .then(function(node) {
    $("html").removeClass("waiting");
    self.selectedSubNode().name(node.name);
    self.selectedSubNode().description(node.description);
    $('a[mt-data-id="' + self.selectedSubNode().id() + '"] span.mt-tooltip').tooltip('dispose');
    $('a[mt-data-id="' + self.selectedSubNode().id() + '"] span.mt-tooltip').tooltip('enable');
    setAlert('Successfully Edited "' + node.name +'"', 'alert-success');
    self.selectedMainNode().children.sort(self.sortByIndexOrPubDateOrName);
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.proceedWithSubNodeEdit ajax call: ' + errorMessage, 'alert-danger')
    }
  });
}

NodesViewModel.prototype.beginAddMain = function() {
  $('#addMainNode').modal({show: true, backdrop: 'static'});
}

NodesViewModel.prototype.addNode = function(nodeData={}, alertId='#alertBox') {
  // add a node
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/add/node';
  var addedNode = null;
  return self.ajax('POST', url, nodeData, self.authHeader)
  .then(function(node) {
    $("html").removeClass("waiting");
    // build adjacencyList structure
    addedNode = new Node(true, node);
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
  })
  .then(function() {
    var main = false;
    var sub = false;
    var item = false;
    if(addedNode.parentId() === self.rootNode.id()) {
      main = true;
      $('a.mt-main-a').removeClass('active');
      $('.mt-main-collapse').collapse('hide');
      $('#accordianCollapse_' + addedNode.id()).on('hide.bs.collapse', handleHideMainCollapse);
      $('#accordianCollapse_' + addedNode.id()).on('show.bs.collapse', handleShowMainCollapse);
      self.selectedMainNode(addedNode);
      $('a[mt-data-id="' + addedNode.id() + '"]').addClass('active');
    } else if(addedNode.parentId() === self.selectedMainNode().id()){
      sub = true;
      $('a.mt-sub-a').removeClass('active');
      $('.mt-sub-collapse').collapse('hide');
      $('#accordianCollapse_' + addedNode.id()).on('hide.bs.collapse', handleHideSubCollapse);
      $('#accordianCollapse_' + addedNode.id()).on('show.bs.collapse', handleShowSubCollapse);
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
    $('.fa, .far').css({'visibility':'visible'});
    if(main) {
      self.context.redirect('#/'+self.type()+'/'+addedNode.id());
    } else if(sub) {
      self.context.redirect('#/'+self.type()+'/'+self.selectedMainNode().id()+'/'+addedNode.id());
    } else {
      self.context.redirect('#/'+self.type()+'/'+self.selectedMainNode().id()+'/'+self.selectedSubNode().id()+'/'+addedNode.id());
    }
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger', alertId)
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.addNode ajax call: ' + errorMessage, 'alert-danger', alertId)
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
  var self = this;
  if(self.selectedItem() && self.selectedMainNode() && self.selectedSubNode()) {
    self.selectedItem().toggleNeed();
    self.updateItem();
  }
}

NodesViewModel.prototype.updateItem = function() {
  var self = this;
  var url = self.selectedItem().uri().replace('http://', 'https://');
  var saveData = self.selectedItem().sanitize();
  self.itemSaveIcon(self.defaultSpinnerIcon);
  self.ajax('PUT', url, saveData, self.authHeader)
  .then(function(response) {
    self.itemSaveIcon(self.defaultItemSaveIcon);
    $("html").removeClass("waiting");
    setAlert('Successfully updated "' + response.name +'"', 'alert-success');
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    self.itemSaveIcon(self.defaultItemSaveIcon);
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel ajax call: ' + errorMessage, 'alert-danger')
    }
  });
}

NodesViewModel.prototype.getNodes = function() {
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/nodes?';
  url += 'ownerId=' + encodeURIComponent(self.currentUserId);
  url += '&type=' + encodeURIComponent(self.type());
  return self.ajax('GET', url, {}, self.authHeader);
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
                        '<b>' + self.subLabel() + ':</b><span> ' + node.children().length + '</span><br>' +
                        '<b>' + self.itemLabel() + 's:</b><span> ' + node.findLeaves().length + '</span><br>' +
                        '<b>Have ' + self.triedLabel() + ':</b><span> ' + node.numLeavesHaveTried() + '</span><br>' +
                        '<b>Need:</b><span> ' + node.leavesNeeded() + '</span><br>';
    } else {
      var tooltipText = '<h5>' + node.name() + ':</h5>' +
                        (node.description() ? '<p>' + node.description() + '</p><br>' : '') +
                        '<b>' + self.itemLabel() + 's:</b><span> ' + node.children().length + '</span><br>' +
                        '<b>Have ' + self.triedLabel() + ':</b><span> ' + node.numLeavesHaveTried() + '</span><br>' +
                        '<b>Need:</b><span> ' + node.leavesNeeded() + '</span><br>';
    }
    return tooltipText;
  });
}

NodesViewModel.prototype.isMain = function(node) {
  var self = this;
  return node.parentId() == self.rootNode.id();
}

NodesViewModel.prototype.buildNodeHierarchy = function(node=null, parentId=null) {
  var self = this;
  var sameParentList;
  var children;
  if(parentId in self.adjacencyList) {
    sameParentList = self.adjacencyList[parentId];
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
    self.buildNodeHierarchy(sibling, sibling.id());
  });
  return node;
}

NodesViewModel.prototype.ajax = function(method, uri, data, authHeader = {}) {
  var self = this;
  setAlert('');
  $("html").addClass("waiting");
  var request = {
    url: uri,
    type: method,
    contentType: "application/json",
    accepts: "application/json",
    cache: false,
    dataType: 'json',
    data: ko.toJSON(data),
    headers: authHeader
  };
  return Promise.resolve($.ajax(request))
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
  nodesViewModel.ajax('GET', url)
  .then(function(data) {
    $("html").removeClass("waiting");
    nodesViewModel.fillItemFromGoogleIcon(nodesViewModel.defaultGoogleIcon);
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
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    nodesViewModel.fillItemFromGoogleIcon(nodesViewModel.defaultGoogleIcon);
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.fillItemFromGoogle ajax call: ' + errorMessage, 'alert-danger')
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
  nodesViewModel.ajax('PUT', url, saveData, nodesViewModel.authHeader)
  .then(function(response) {
    nodesViewModel.itemSaveIcon(nodesViewModel.defaultItemSaveIcon);
    nodesViewModel.selectedItem().updateData(self.itemNode().data());
    $("html").removeClass("waiting");
    setAlert('Successfully Updated "' + nodesViewModel.selectedItem().name() +'"', 'alert-success');
    nodesViewModel.loadItem();
    $("#editItemNode").modal("hide");
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    nodesViewModel.itemSaveIcon(nodesViewModel.defaultItemSaveIcon);
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger', '#editItemNodeAlertBox')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel ajax call: ' + errorMessage, 'alert-danger', '#editItemNodeAlertBox')
    }
  });
}

EditItemNodeModel.prototype.proceedWithItemNodeEdit = function(nodeData = {}) {
  // add a main or sub node
  var self = this;
  var url = secrets['MY_THINGS_SERVER'] + '/node/' + self.subNode().id();
  nodesViewModel.ajax('PUT', url, nodeData, nodesViewModel.authHeader)
  .then(function(node) {
    $("html").removeClass("waiting");
    self.selectedSubNode().name(node.name);
    self.selectedSubNode().description(node.description);
    $('a[mt-data-id="' + self.selectedSubNode().id() + '"] span.mt-tooltip').tooltip('dispose');
    $('a[mt-data-id="' + self.selectedSubNode().id() + '"] span.mt-tooltip').tooltip('enable');
    setAlert('Successfully Edited "' + node.name +'"', 'alert-success');
    self.selectedMainNode().children.sort(self.sortByIndexOrPubDateOrName);
  })
  .catch(function(err) {
    $("html").removeClass("waiting");
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON['error'], 'alert-danger')
    } else {
      var errorMessage = err.state();
      if(err.state() === 'rejected') {
        errorMessage = 'Possible network issue. Please try again later.';
      }
      setAlert('error in NodesViewModel.proceedWithItemNodeEdit ajax call: ' + errorMessage, 'alert-danger')
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
  self.username('');
  self.password('');
  self.types([]);
  self.context = null;
  nodesViewModel.login(username, password, type)
  .then(function(data) {
    nodesViewModel.currentUser(username);
    nodesViewModel.currentUserPassword = password;
    nodesViewModel.currentUserId = data.id;
    nodesViewModel.authHeader = {'Authorization':'Basic ' + btoa(nodesViewModel.currentUser() + ':' + nodesViewModel.currentUserPassword)};
  })
  .catch(function(err) {
    $('html').removeClass('waiting');
    if (err.status == 403){
      $('#loginBtn').css({'visibility':'visible'});
      setAlert('Incorrect username or password. Try again', 'alert-danger');
    }
    nodesViewModel.loggedIn(false);
  })
  .then(function(data) {
    $('html').removeClass('waiting');
    if(nodesViewModel.loggedIn()) {
      nodesViewModel.unloadItem();
      nodesViewModel.type(type);
      context.redirect('#/'+type)
    }
  })
  .catch(function(err) {
    console.log(err.stack)
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
  var itemNode = $('a[mt-data-id="' + nodesViewModel.selectedItem().id() + '"]');
  var selectionOffsetTop = itemNode.offset().top;
  accordianMain.animate({
     scrollTop: containerScrollTop+selectionOffsetTop-containerOffsetTop});
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

var handleMainClick =  function(mainNode, scroll=false) {
  $('a.mt-main-a, a.mt-sub-a, a.mt-item-a').removeClass('active');
  mainNode.addClass('active');
  var node = nodesViewModel.findNode(mainNode.attr('mt-data-id'));
  nodesViewModel.selectedMainNode(node);
  nodesViewModel.selectedMainNode().children.sort(nodesViewModel.sortByIndexOrPubDateOrName);
  nodesViewModel.selectedSubNode(null);
  nodesViewModel.selectedItem(null);
  nodesViewModel.unloadItem();
  if(nodesViewModel.selectedSubNode()) {
    var subNode = $('a[mt-data-id="' + nodesViewModel.selectedSubNode().id() + '"]');
    $(subNode.attr('data-target')).collapse('hide');
    $(subNode.attr('data-target')).on('hidden.bs.collapse', showMainCollapse);
  } else {
    showMainCollapse();
  }
  if(scroll) {
    $(mainNode.attr('data-target')).on('shown.bs.collapse', scrollToSelectedMainNode)
  }
}

var handleSubClick = function(subNode, scroll=false) {
  $('a.mt-sub-a, a.mt-item-a').removeClass('active');
  subNode.addClass('active');
  var node = nodesViewModel.findNode(subNode.attr('mt-data-id'));
  nodesViewModel.selectedSubNode(node);
  nodesViewModel.selectedSubNode().children.sort(nodesViewModel.sortByIndexOrPubDateOrName);
  nodesViewModel.selectedItem(null);
  nodesViewModel.unloadItem();
  showSubCollapse();
  if(scroll) {
    $(subNode.attr('data-target')).on('shown.bs.collapse', scrollToSelectedSubNode);
  }
}

var handleItemClick = function(itemNode, scroll=false) {
  $('a.mt-item-a').removeClass('active');
  itemNode.addClass('active');
  var node = nodesViewModel.findNode(itemNode.attr('mt-data-id'));
  nodesViewModel.selectedItem(node);
  nodesViewModel.loadItem();
  if(scroll) {
    scrollToSelectedItem();
  }
}

var initType = function() {
  var self = this;
  if(self.value !== nodesViewModel.type()) {
    nodesViewModel.unloadItem();
    nodesViewModel.context.redirect('#/' + $('#typesSelect').val())
  }
}

var login = function(context) {
  nodesViewModel.context = context;
  nodesViewModel.previousUser = nodesViewModel.currentUser();
  nodesViewModel.previousUserPassword = nodesViewModel.currentUserPassword;
  loginModel.types(nodesViewModel.types());
  loginModel.context = context;
  $('#login').modal({show: true,
                     backdrop: 'static'});
}

var logout = function(context) {
  nodesViewModel.context = context;
  nodesViewModel.logout();
  nodesViewModel.context.redirect('#/login');

}

var setType = function(context) {
  nodesViewModel.context = context;
  nodesViewModel.type(context.params['type']);
  if(!nodesViewModel.loggedIn()) {
    nodesViewModel.context.redirect('#/login');
  }
  nodesViewModel.type(context.params['type']);
  nodesViewModel.filterText('');
  nodesViewModel.selectedItem(null);
  nodesViewModel.unloadItem();
  nodesViewModel.selectedSubNode(null);
  nodesViewModel.selectedMainNode(null);
  nodesViewModel.setType();
  $('#itemDetailsTab').tab('show');
}

var selectMain = function(context) {
  nodesViewModel.context = context;
  var type = context.params['type'];
  var mainNodeId = context.params['main'];
  var mainNode = $('a[href="#/'+type+'/'+mainNodeId+'"]');
  handleMainClick(mainNode, scroll=true);
  $('#itemDetailsTab').tab('show');
}

var selectSub = function(context) {
  nodesViewModel.context = context;
  var type = context.params['type'];
  var mainNodeId = context.params['main'];
  var subNodeId = context.params['sub'];
  var mainNodeId = nodesViewModel.findNode(subNodeId).parentId();
  var mainNode = $('a[href="#/'+type+'/'+mainNodeId+'"]');
  var subNode = $('a[href="#/'+type+'/'+mainNodeId+'/'+subNodeId+'"]');
  handleMainClick(mainNode);
  handleSubClick(subNode, scroll=true);
  $('#itemDetailsTab').tab('show');
}

var selectItem = function(context) {
  nodesViewModel.context = context;
  var type = context.params['type'];
  var mainNodeId = context.params['main'];
  var subNodeId = context.params['sub'];
  var itemNodeId = context.params['item'];
  var itemNode = $('a[href="#/'+type+'/'+mainNodeId+'/'+subNodeId+'/'+itemNodeId+'"]');
  var subNodeId = nodesViewModel.findNode(itemNode.attr('mt-data-id')).parentId();
  var subNode = $('a[href="#/'+type+'/'+mainNodeId+'/'+subNodeId+'"]');
  var mainNodeId = nodesViewModel.findNode(subNodeId).parentId();
  var mainNode = $('a[href="#/'+type+'/'+mainNodeId+'"]');
  handleMainClick(mainNode, expandMain=true, collapseSub=true, scroll=false);
  handleSubClick(subNode);
  handleItemClick(itemNode, scroll=true);
  $('#itemDetailsTab').tab('show');
}

var toggleItemNeed = function(context) {
  nodesViewModel.context = context;
  var type = context.params['type'];
  var mainNodeId = context.params['main'];
  var subNodeId = context.params['sub'];
  var itemNodeId = context.params['item'];
  var itemNode = $('a[href="#/'+type+'/'+mainNodeId+'/'+subNodeId+'/'+itemNodeId+'"]');
  var subNodeId = nodesViewModel.findNode(itemNode.attr('mt-data-id')).parentId();
  var subNode = $('a[href="#/'+type+'/'+mainNodeId+'/'+subNodeId+'"]');
  var mainNodeId = nodesViewModel.findNode(subNodeId).parentId();
  var mainNode = $('a[href="#/'+type+'/'+mainNodeId+'"]');
  handleMainClick(mainNode, scroll=false);
  handleSubClick(subNode, scroll=false);
  handleItemClick(itemNode, scroll=true);
  $('#itemDetailsTab').tab('show');
  nodesViewModel.toggleItemNeed();
  nodesViewModel.context.redirect('/#'+mainNodeId+'/'+subNodeId+'/'+itemNodeId);
}

setAlert('');
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
  self.get('#/:type/:main', selectMain);
  self.get('#/:type/:main/:sub', selectSub);
  self.get('#/:type/:main/:sub/:item', selectItem);
  self.get('#/:type/:main/:sub/:item/toggleNeed', toggleItemNeed);
});

$('#typesSelect').on('keyup mouseup', initType);
$('#itemNodeTried').on('change', editItemNodeModel.setDateTriedItem.bind(editItemNodeModel));
$(document).keypress(function(e) {
  if(e.which == 13) {
    if(document.activeElement.id === 'itemNodeInfo4' && nodesViewModel.nodeInfo4Key() === 'ISBN') {
      // ISBN
      e.preventDefault();
      editItemNodeModel.fillItemFromGoogle();
    } else {
      if($('.modal-open').length) {
        e.preventDefault();
        $('.modal.show').find('button.btn-primary').click();
      }
    }
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
Promise.resolve($.ajax({
  cache: false,
  url: "my_things/.secrets.json",
  dataType: "json"
}))
.catch(function(err) {
  $("html").removeClass("waiting");
  var errorMessage = err.state();
  if(err.state() === 'rejected') {
    errorMessage = 'Possible network issue. Please try again later.';
  }
  setAlert('error getting secrets file: ' + errorMessage, 'alert-danger');
})
.then(function(jsonSecrets) {
  $("html").removeClass("waiting");
  secrets = jsonSecrets;
}) // .then after getting secrets
.then(function() {
  app.run('#/login');
})
