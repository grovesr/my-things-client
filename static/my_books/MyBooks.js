
 // Enter the API Discovery Docs that describes the APIs you want to
 // access. In this example, we are accessing the People API, so we load
 // Discovery Doc found here: https://developers.google.com/people/api/rest/
 var discoveryDocs = ["https://www.googleapis.com/discovery/v1/apis/books/v1/rest"];

 // Enter one or more authorization scopes. Refer to the documentation for
 // the API or https://developers.google.com/people/v1/how-tos/authorizing
 // for details.
 var scopes = 'https://www.googleapis.com/auth/books';
 //"use strict";
// Global Variables
var defaultAlert = "My Books";
var myRootNode = null;
var authorizeButton = null;
var signoutButton = null;
var processButton = null;
var sendMainToMyThingsButton = null;
var sendSubToMyThingsButton = null;
var secrets;
var currentUser = 'grovesr';
var currentUserId = 5;
var currentUserPassword = 'zse45rdx';
var currentType = 'books';

function handleClientLoad() {
 // Load the API client and auth2 library
 gapi.load('client:auth2', initClient);
}

function enableProcessButton() {
  processButton.style.display = 'block';
  processButton.onclick = mainFunction;
}

function initClient() {
 secrets;
 gapi.client.init({
     apiKey: secrets['MY_BOOKS_KEY'],
     discoveryDocs: discoveryDocs,
     clientId: secrets['MY_BOOKS_CLIENT_ID'],
     scope: scopes
 }).then(function () {
   // Listen for sign-in state changes.
   gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

   // Handle the initial sign-in state.
   updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

   authorizeButton.onclick = handleAuthClick;
   signoutButton.onclick = handleSignoutClick;
 }).catch( function(err) {
   console.log(err  + '\n' + err.stack);
 });
}

function updateSigninStatus(isSignedIn) {
 if (isSignedIn) {
   authorizeButton.style.display = 'none';
   signoutButton.style.display = 'block';
   processButton.style.display = 'block';
 } else {
   authorizeButton.style.display = 'block';
   signoutButton.style.display = 'none';
   processButton.style.display = 'none';
 }
}

function handleAuthClick(event) {
 gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
 gapi.auth2.getAuthInstance().signOut();
}

function prepareMyThingsAddNodeQuery(cat) {
  var url = 'https://' + secrets['MY_THINGS_SERVER'] + '/add/node';
  data = {};
  data['name'] = cat.subCat;
  data['owner'] = currentUser;
  data['nodeInfo'] = {};
  data['type'] = 'books';
  if(cat.mainCat !== '' ) {
    // get the parent node so you can find the id
    parentCat = new SubCat();
    parentCat.subCat = cat.mainCat;
    return prepareMyThingsGetNodeQuery(parentCat)
    .then(function (response) {
      data['parentId'] =response['id'];
      return Promise.resolve($.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
        crossDomain: true,
        cache: false,
        headers: {'Authorization':'Basic ' + btoa(currentUser + ':' + currentUserPassword)}
      }));
    });
  } else {
    return Promise.resolve($.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(data),
      contentType: 'application/json',
      dataType: 'json',
      crossDomain: true,
      cache: false,
      headers: {'Authorization':'Basic ' + btoa(currentUser + ':' + currentUserPassword)}
    }));
  }
}

function prepareMyThingsGetNodeQuery(cat) {
  var url = 'https://' +secrets['MY_THINGS_SERVER'] + '/get/node?';
  url += 'nodename=' + encodeURIComponent(cat.subCat);
  url += '&ownername=' + encodeURIComponent(currentUser);
  if(cat.mainCat.length > 0) {
    url += '&parentname=' + encodeURIComponent(cat.mainCat);
  }
  return Promise.resolve($.ajax({
    type: "GET",
    url: url,
    contentType: 'application/json',
    dataType: 'json',
    crossDomain: true,
    cache: false,
    headers: {'Authorization':'Basic ' + btoa(currentUser + ':' + currentUserPassword)}
  }));
}

function prepareMyThingsGetItemQuery(item) {
  var url = 'https://' +secrets['MY_THINGS_SERVER'] + '/get/node?';
  url += 'nodename=' + encodeURIComponent(item.itemInfo['title']);
  url += '&ownername=' + encodeURIComponent(currentUser);
  if(item.subCat) {
    url += '&parentname=' + encodeURIComponent(item.subCat.subCat);
  }
  return Promise.resolve($.ajax({
    type: "GET",
    url: url,
    contentType: 'application/json',
    dataType: 'json',
    crossDomain: true,
    cache: false,
    headers: {'Authorization':'Basic ' + btoa(currentUser + ':' + currentUserPassword)}
  }));
}

function prepareMyThingsAddItemQuery(item) {
  var url = 'https://' + secrets['MY_THINGS_SERVER'] + '/add/node';
  item['addData'] = {};
  if(typeof item.itemInfo['title'] == 'undefined' || item.itemInfo['title'].length == 0) {
    item['addData']['name'] = 'unknown';
  } else {
    item['addData']['name'] = item.itemInfo['title'];
  }
  item['addData']['owner'] = currentUser;
  item['addData']['nodeInfo'] = {};
  item['addData']['nodeInfo']['authors'] = item.itemInfo['authors'];
  item['addData']['nodeInfo']['nodes'] = item.itemInfo['nodes'];
  item['addData']['nodeInfo']['googleLink'] = item.itemInfo['canonicalVolumeLink'];
  item['addData']['nodeInfo']['description'] = item.itemInfo['description'];
  item['addData']['nodeInfo']['googleLink'] = item.itemInfo['infoLink'];
  item['addData']['nodeInfo']['pageCount'] = item.itemInfo['pageCount'];
  item['addData']['nodeInfo']['googlePreviewLink'] = item.itemInfo['previewLink'];
  item['addData']['nodeInfo']['publisher'] = item.itemInfo['publisher'];
  item['addData']['nodeInfo']['publishedDate'] = item.itemInfo['publishedDate'];
  if(typeof item.itemInfo['imageLinks'] !=='undefined') {
    if(typeof item.itemInfo['imageLinks']['smallThumbnail'] !== 'undefined') {
      item['addData']['nodeInfo']['googleSmallThumbnail'] = item.itemInfo['imageLinks']['smallThumbnail'];
    }
    if(typeof item.itemInfo['imageLinks']['thumbnail']  !== 'undefined') {
      item['addData']['nodeInfo']['googleThumbnail'] = item.itemInfo['imageLinks']['thumbnail'];
    }
    if(typeof item.itemInfo['industryIdentifiers'] !== 'undefined') {
      for(var indx=0; indx < item.itemInfo['industryIdentifiers'].length; indx++) {
        item['addData']['nodeInfo'][item.itemInfo['industryIdentifiers'][indx]['type']] = item.itemInfo['industryIdentifiers'][indx]['identifier'];
      }
    }
  }
  item['addData']['type'] = 'books';
  // get the parent node so you can find the id
  parentCat = new SubCat();
  parentCat.subCat = item.subCat.subCat;
  parentCat.mainCat = item.subCat.mainCat;
  return prepareMyThingsGetNodeQuery(parentCat)
  .then(function (response) {
    this['addData']['parentId'] =response['id'];
    return Promise.resolve($.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(this['addData']),
      contentType: 'application/json',
      dataType: 'json',
      crossDomain: true,
      cache: false,
      headers: {'Authorization':'Basic ' + btoa(currentUser + ':' + currentUserPassword)}
    }));
  }.bind(item));
}

//Global Functions
function setAlert(alertText, alertClass = "") {
   $('#alertBox').empty();
   $('#alertBox').removeClass('c-alert--error');
   $('#alertBox').removeClass('c-alert--warning');
   $('#alertBox').removeClass('c-alert--success');
   if( alertClass.length > 0) {
       $('#alertBox').addClass(alertClass);
   };
   $('#alertBox').append("&nbsp;");
   $('#alertBox').append("<button id='alert' class='c-button c-button--close'>&times;</button><span id='alertText'></span>")
   $('#alertText').text(alertText);
   $('#alert').on('click', function () {
       $('#alertBox').empty();
       $('#alertBox').removeClass('c-alert--error');
       $('#alertBox').removeClass('c-alert--warning');
       $('#alertBox').append(defaultAlert);
       $('#alertBox').removeClass('c-alert--success');
   });
}

function readTrimDistances() {
 distanceLim = [Number($('#beginDist').val()), Number($('#endDist').val())];
}
function getRadioVal(form, name) {
 var val = "az";
  if(typeof form !== "undefined") {
   // get list of radio buttons with specified name
   var radios = form.elements[name];

   // loop through list of radio buttons
   for (var i=0, len=radios.length; i<len; i++) {
       if ( radios[i].checked ) { // radio checked?
           val = radios[i].value; // if so, hold its value in val
           break; // and break out of for loop
       }
   }
 }
 return val; // return value of checked radio
}

function Node(name=null) {
  this.id = null;
  this.name = name;
  this.type = null;
  this.ownerId = null;
  this.parentId = null;
  this.description = '';
  this.nodeInfo = {};
  this.haveTried = false;
  this.dateTried = new Date();
  this.review = '';
  this.rating = 0;
  this.dateReviewed = new Date();
  this.children = [];
  this.childCount = 0;
    // from my-things-server model
    // id =            db.Column(db.Integer,     primary_key=True, nullable=False)
    // name =          db.Column(db.String(128), unique=False, nullable=False)
    // type =          db.Column(db.String(16),  unique=False, nullable=True)
    // description =   db.Column(db.Text,        unique=False, nullable=True)
    // nodeInfo =      db.Column(JSON,           unique=False, nullable=True)
    // haveTried =     db.Column(db.Boolean,     unique=False, nullable=True, default=False)
    // dateTried =     db.Column(db.Date,        unique=False, nullable=True)
    // review =        db.Column(db.Text,        unique=False, nullable=True)
    // rating =        db.Column(db.Integer,     unique=False, nullable=True)
    // dateReviewed =  db.Column(db.Date,        unique=False, nullable=True)
    // ownerId =       db.Column(db.Integer, db.ForeignKey('user.id'), unique=False, nullable=False)
    // parentId =      db.Column(db.Integer, db.ForeignKey('node.id'), unique=False, nullable=True)
    // owner =         db.relationship('User', lazy=True)
    // children =      db.relationship('Node', backref=backref('parent', remote_side=[id]),
    //                                 single_parent=True, lazy=True, cascade="all, delete, delete-orphan")
}

Node.prototype.fillChildNodesFromQuery = function(){
  return this.prepareMyThingsGetChildNodesQuery(type = currentType)
  .then(function(response) {
    this.children = [];
     for(var indx = 0; indx < response.nodeCount; indx++) {
       thisNodeResponse = response.nodes[indx];
       // loop through each subNode returned
       var thisSubNode = new Node();
       thisSubNode.id = thisNodeResponse.id;
       thisSubNode.name = thisNodeResponse.name;
       thisSubNode.type = thisNodeResponse.type;
       thisSubNode.ownerId = thisNodeResponse.ownerId;
       thisSubNode.parentId = thisNodeResponse.parentId;
       if(thisNodeResponse.nodeInfo.description) {
         thisSubNode.description = thisNodeResponse.nodeInfo.description;
       }
       if(thisNodeResponse.nodeInfo) {
         thisSubNode.nodeInfo = JSON.parse(thisNodeResponse.nodeInfo);
       }
       thisSubNode.haveTried = thisNodeResponse.haveTried;
       thisSubNode.dateTried = thisNodeResponse.dateTried;
       if(thisNodeResponse.review) {
         thisSubNode.review = thisNodeResponse.review;
       }
       thisSubNode.rating = thisNodeResponse.rating;
       if(thisNodeResponse.dateReviewed) {
         thisSubNode.dateReviewed = thisNodeResponse.dateReviewed;
       }
       thisSubNode.childCount = thisNodeResponse.childCount;
       this.children.push(thisSubNode);
     }
   }.bind(this))
  .catch(function(err) {
    if(typeof err.responseJSON === 'undefined') {
      return Promise.resolve(err)
    } else {
      return Promise.resolve(err.responseJSON['error'])
    }
  });
}

Node.prototype.prepareMyThingsGetChildNodesQuery = function() {
  if(this.id === null) {
    var url = 'https://' +secrets['MY_THINGS_SERVER'] + '/get/main/nodes?';
  } else {
    var url = 'https://' +secrets['MY_THINGS_SERVER'] + '/get/nodes?';
  }
  url += 'ownerId=' + encodeURIComponent(currentUserId);
  url += '&type=' + encodeURIComponent(this.type);
  if(this.id !== null) {
    url += '&searchField=parentId';
    url += '&searchValue=' + encodeURIComponent(this.id);
  }
  return Promise.resolve($.ajax({
    type: "GET",
    url: url,
    contentType: 'application/json',
    dataType: 'json',
    crossDomain: true,
    cache: false,
    headers: {'Authorization':'Basic ' + btoa(currentUser + ':' + currentUserPassword)}
  }));
}

Node.prototype.prepareMyThingsUpdateNodeQuery = function(props) {
  var url = 'https://' + secrets['MY_THINGS_SERVER'] + '/update/node/' + encodeURIComponent(this.id);
  data = {};
  properties = Object.keys(props);
  for(var indx=0; indx < properties.length; indx++) {
    data[properties[indx]] = props[properties[indx]];
  }
  return Promise.resolve($.ajax({
    type: "PUT",
    url: url,
    data: JSON.stringify(data),
    contentType: 'application/json',
    dataType: 'json',
    crossDomain: true,
    cache: false,
    headers: {'Authorization':'Basic ' + btoa(currentUser + ':' + currentUserPassword)}
  }));
}

Node.prototype.findChildById  = function(id) {
  var foundChild = null;
  for(var indx=0; indx < this.children.length; indx++) {
    if(this.children[indx]['id'] == id) {
      foundChild = this.children[indx];
      break;
    }
  }
  return foundChild
}

Node.prototype.findDescendantById  = function(id) {
  if(this.children.length === 0 && this.id == id) {
    return this
  }
  var foundChild = null;
  for(var indx=0; indx < this.children.length; indx++) {
    if(this.children[indx]['id'] == id) {
      foundChild = this.children[indx];
      break;
    }
    foundChild = this.children[indx].findDescendantById(id);
    if(foundChild) {
      break;
    }
  }
  return foundChild
}

// object to hold users bookshelves
function MainCat(users = "", access_token = "") {
 this.users = users;
 this.access_token = access_token;
 this.kind = '';
 this.items = {};
 this.numSubCats = 0;
};

MainCat.prototype.findSubCatByTitle = function(mainTitle, subTitle){
 var foundSubCat = null;
 var subCatTitleUserPrefix = mainTitle + ' - ';

 Object.keys(this.items[mainTitle]).forEach(function (subCat) {
   if(this.items[mainTitle][subCat].title === subTitle ||
   this.items[mainTitle][subCat].title === subCatTitleUserPrefix + subTitle) {
     foundSubCat = this.items[mainTitle][subCat];
   }
 }.bind(this));
 return foundSubCat;
}

MainCat.prototype.findSubCatByKey = function(key){
 var foundSubCat = null;
 var theseCats = this;
 Object.keys(this.items).forEach(function (mainCat) {
   if(key in theseCats.items[mainCat]) {
     foundSubCat = theseCats.items[mainCat][key];
   }
 });
 return foundSubCat;
}

MainCat.prototype.findItemByKey = function(key){
 var foundItem = null;
 Object.keys(this.items).forEach(function (mainCat) {
   Object.keys(this.items[mainCat]).forEach(function(subCat) {
     if(key in this.items[mainCat][subCat].items) {
       foundItem = this.items[mainCat][subCat].items[key];
     }
   }.bind(this));
 }.bind(this));
 return foundItem;
}

MainCat.prototype.subCatHasReadByKey = function(mainCatKey, subCatKey) {
  var result = false
  Object.keys(this.items[mainCatKey][subCatKey].items).forEach(function(item) {
    if(this.items[mainCatKey][subCatKey].items[item].id in  this.items['System Categories'][4].items) {
      result = true;
    }
  }.bind(this));
  return result;
}

MainCat.prototype.subCatHasReviewedByKey = function(mainCatKey, subCatKey) {
  var result = false
  Object.keys(this.items[mainCatKey][subCatKey].items).forEach(function(item) {
    if(this.items[mainCatKey][subCatKey].items[item].id in  this.items['System Categories'][5].items) {
      result = true;
    }
  }.bind(this));
  return result;
}

MainCat.prototype.fillSubCatsFromQuery = function(){
  return gapi.client.books.mylibrary.bookshelves.list()
  .then(function(response) {
   var data = response.result;
   // data is the JSON result of a subCat query
   this.items = {};
   this.kind = data['kind'];
   for(var indx = 0; indx < data['items'].length; indx++) {
    // loop through each subCat returned
    var thisSubCat = new SubCat();
    thisSubCat.users = this.users;
    thisSubCat.access_token = this.access_token;
    thisSubCat.getSubCat(data['items'][indx]);
    // load the subCat with meta data
    if(!(thisSubCat.mainCat in this.items)) {
      // if the main category hasn't already been loaded into the dictionary
      // create an dictionary in which to place the subcats for this main thing
      this.items[thisSubCat.mainCat] = {};
    }
    this.items[thisSubCat.mainCat][thisSubCat.id]=thisSubCat;
    this.numSubCats++;
   }
 }.bind(this))
  .catch(function(err) {
   console.log('error in gapi call'+ err + '\n' + err.stack);
  });
}

MainCat.prototype.sendToMyThings = function(){
  prepareMyThingsAddNodeQuery(this)
  .then(function() {
    $('#send-main-to-my-things-button').text('Already added to My Things');
    $('#send-main-to-my-things-button').off();
    $('#send-main-to-my-things-button').prop('disabled', true);
    setAlert('successfully added main node "' + cat.subCat + '"', 'c-alert--success')
  })
  .catch(function(err) {
    setAlert(err.responseJSON['error'], 'c-alert--error')
  })
}

MainCat.prototype.checkIfInMyThings = function (name) {
  cat = new SubCat();
  cat.subCat = name;
  prepareMyThingsGetNodeQuery(cat)
  .then(function() {
    // disable add to my things button
    $('#send-main-to-my-things-button').text('Already added to My Things');
    $('#send-main-to-my-things-button').off();
    $('#send-main-to-my-things-button').prop('disabled', true);
  })
  .catch(function(err) {
    $('#send-main-to-my-things-button').off();
    // enable to my things button
    $('#send-main-to-my-things-button').text('Send Author to MyThings');
    $('#send-main-to-my-things-button').on('click', myRootNode.sendToMyThings.bind(cat));
    $('#send-main-to-my-things-button').prop('disabled', false);
  })
}

// object to hold a single subCat
function SubCat() {
 this.users = null;
 this.access_token;
 this.kind = null;
 this.id = null;
 this.items = {};
 this.totalItems = 0;
 this.selfLink = null;
 this.title = null;
 this.description = null;
 this.mainCat = '';
 this.subCat = '';
 this.access = null;
 this.updated = null;
 this.created = null;
 this.itemCount = null;
 this.itemsLastUpdated = null;
};

SubCat.prototype.findItemByTitle = function(title){
 var foundItem = null;
 Object.keys(this.items).forEach(function (volume) {
   if(volume.title === title) {
     foundItem = volume;
   }
 });
 return foundItem;
}

SubCat.prototype.getSubCat = function(data) {
 // get the subcat meta data, but not the items contained within
 var description = '';
 this.kind = data['kind'];
 this.id = data['id'];
 this.items = {};
 this.selfLink = data['selfLink'];
 this.title = data['title'];
 if(typeof data['description'] !== 'undefined') {
   description = data['description']
 }
 this.description = description;
 if(this.id > 1000) {
   var splitIndex = this.title.indexOf('-');
   if(splitIndex) {
     this.mainCat = this.title.slice(0, splitIndex-1);
     this.subCat = this.title.slice(splitIndex + 2);
   }
 } else {
   this.mainCat = 'System Categories';
   this.subCat = this.title;
 }
 this.access = data['access'];
 this.updated = data['updated'];
 this.created = data['created'];
 this.itemCount = data['volumeCount'];
 this.itemsLastUpdated = data['volumesLastUpdated'];
}

SubCat.prototype.fillSubCatFromQuery = function(update = true){
  if(update || Object.keys(this.items).length === 0) {
    return gapi.client.books.mylibrary.bookshelves.volumes.list({
     'shelf': this.id,
     'projection': 'full',
     'maxResults':999
    })
   .then(function(response) {
     var data = response.result;
     // data is the JSON result of an items query
     this.itemCount = data['totalItems'];
     this.items = {};
     var thisSubCat = this;
     if('items' in data) {
       for(var indx = 0; indx < data['items'].length; indx++) {
         // for each volume retrieved
         var thisItem = new Item();
         thisItem.subCat = this;
         thisItem.fillItemFromData(data['items'][indx]);
         thisSubCat.items[thisItem.id] = thisItem;
       }
     }
   }.bind(this))
   .catch(function(err) {
    console.log('error in gapi call' + err + '\n' + err.stack);
   });
 } else {
   return Promise.resolve();
 }
}

SubCat.prototype.contains = function(volumeId){
  return volumeId in this.items;
}

SubCat.prototype.sendToMyThings = function(){
  // add the subCat to myThings
  prepareMyThingsAddNodeQuery(this)
  .then(function() {
    // subCat and items have been added. Disable the send to My Things button
    setAlert('successfully added subCat node "' + this.mainCat + '":"' + this.subCat + '" and all items', 'c-alert--success');
    $('#send-sub-to-my-things-button').text('Already added to My Things');
    $('#send-sub-to-my-things-button').off();
    $('#send-sub-to-my-things-button').prop('disabled', true);
  }.bind(this))
  .catch(function(err) {
    // something happened along the way that wasn't handled
    setAlert(err.responseJSON['error'], 'c-alert--error')
  });
}

SubCat.prototype.sendItemsToMyThings = function() {
  var itemPromises = []
  Object.keys(this.items).forEach(function(item) {
    itemPromises.push(this.items[item].checkIfInMyThings())
  }.bind(this))
  Promise.all(itemPromises)
  .then(function(results) {
    // go through this subCat's item query results and see if any haven't yet been added to My Things
    var itemPromises = [];
    for(var indx = 0; indx < Object.values(results).length; indx++) {
      if(Object.keys(Object.values(results)[indx]).includes('error')) {
        // the item doesn't exist prepare an add query
        itemPromises.push(Object.values(results)[indx]['item'].sendToMyThings());
      }
    }
    Promise.all(itemPromises)
    .then(function(itemResults) {
      var alert = '';
      // after trying to add the missing items check to make sure there were no errors
      for(var indx = 0; indx < Object.values(itemResults).length; indx++) {
        if(Object.keys(Object.values(itemResults)[indx]).includes('error')) {
          // if there was an error prepare an alert
          alert += 'error: ' +Object.values(itemResults)[indx]['error'] + "\n";
        }
      }
      if(alert.length > 0) {
        setAlert(alert, 'c-alert--error');
      } else {
        setAlert('successfully added all books to "' + this.mainCat + '":"' + this.subCat + '"', 'c-alert--success');
        $('#send-subs-items-to-my-things-button').text('Already added to My Things');
        $('#send-subs-items-to-my-things-button').off();
        $('#send-subs-items-to-my-things-button').prop('disabled', true);
      }
    }.bind(this))
    .catch(function(err) {
      // something happened along the way that wasn't handled
      setAlert(err.responseJSON['error'], 'c-alert--error')
    })
  }.bind(this));
}

SubCat.prototype.checkIfInMyThings = function () {
  prepareMyThingsGetNodeQuery(this)
  .then(function() {
    // subCat found in My Things, disable send to My Things button
    $('#send-sub-to-my-things-button').text('Already added to My Things');
    $('#send-sub-to-my-things-button').off();
    $('#send-sub-to-my-things-button').prop('disabled', true);
    }.bind(this))
  .catch(function(err) {
    // the subCat doesn't exist in myThings so enable the send to My Things button
    $('#send-sub-to-my-things-button').off();
    // enable to my things button
    $('#send-sub-to-my-things-button').text('Send Series to My Things');
    $('#send-sub-to-my-things-button').on('click', this.sendToMyThings.bind(this));
    $('#send-sub-to-my-things-button').prop('disabled', false);
  })
  this.checkIfItemsInMyThings()
}

SubCat.prototype.checkIfItemsInMyThings = function() {
  var itemPromises = []
  Object.keys(this.items).forEach(function(item) {
    itemPromises.push(this.items[item].checkIfInMyThings())
  }.bind(this))
  return Promise.all(itemPromises)
  .then(function(results) {
    // now check the individual items to see if they all are in My Things as well.
    // If any are not, enable the send to My Things button
    var allAdded = true;
    for(var indx = 0; indx < Object.values(results).length; indx++) {
      if(Object.keys(Object.values(results)[indx]).includes('error')) {
        // the item doesn't exist yet enable the send to My Things button
        allAdded = false;
        break;
      }
    }
    if(allAdded) {
      // all subCat's items found in My Things, disable send to My Things button
      $('#send-subs-items-to-my-things-button').text('Already added all items to My Things');
      $('#send-subs-items-to-my-things-button').off();
      $('#send-subs-items-to-my-things-button').prop('disabled', true);
    } else {
      // one or more of the subCat's items don't exist in myThings so enable the send to My Things button
      $('#send-subs-items-to-my-things-button').off();
      // enable to my things button
      $('#send-subs-items-to-my-things-button').text('Send Series items to My Things');
      $('#send-subs-items-to-my-things-button').on('click', this.sendItemsToMyThings.bind(this));
      $('#send-subs-items-to-my-things-button').prop('disabled', false);
    }
  }.bind(this))
}

// object to hold a single item
function Item() {
 this.subCat = null;
 this.kind = null;
 this.id = null;
 this.etag = null
 this.selfLink = null;
 this.itemInfo = {};
};

Item.prototype.fillItemFromQuery = function() {
  return gapi.client.books.volumes.get({
   'volumeId': this.id,
   'projection':'full'
  })
 .then(function(response) {
   var data = response.result;
   // data is the JSON result of an items query
   this.id = data['id'];
   this.kind = data['kind'];
   this.etag = data['etag'];
   this.selfLink = data['selfLink'];
   this.itemInfo = data['volumeInfo'];
   this.userInfo = data['userInfo'];
 }.bind(this)).catch(function(err) {
  console.log('error in gapi call' + err + '\n' + err.stack);
 });
}

Item.prototype.fillItemFromData = function(data) {
 this.id = data['id'];
 this.kind = data['kind'];
 this.etag = data['etag'];
 this.selfLink = data['selfLink'];
 this.itemInfo = data['volumeInfo'];
 this.userInfo = data['userInfo'];
}

Item.prototype.sendToMyThings = function(){
  return prepareMyThingsAddItemQuery(this)
  .catch(function(err) {
    Promise.resolve(err.responseJSON['error']);
  });
}

Item.prototype.checkIfInMyThings = function () {
  return prepareMyThingsGetItemQuery(this)
  .then(function(response) {
    response['item'] = this;
    return Promise.resolve(response);
  }.bind(this))
  .catch(function(err) {
    err.responseJSON['item'] = this;
    return Promise.resolve(err.responseJSON);
  }.bind(this))
}

var toggleCategoryTreeItem = function() {
  thisNodeId = $(this).attr('nodeId');
  thisNode = myRootNode.findDescendantById(thisNodeId);
  $('#main_haveTried').attr('nodeId', thisNodeId);
 if($(this).hasClass('c-tree__item--expandable')) {
   // expand mainCat's nodes & collapse any others already expanded
   $('#haveTriedItemDiv').hide();
   $('#haveTriedSubNodeDiv').hide();
   $('#haveTriedMainNodeDiv').hide();
   $('#subNodeInfoHeader').hide();
   $('#itemInfoHeader').hide();
   $('.mt-sub-cat, .mt-item').hide(); // hide all author's nodes first
   $('.c-tree__item--expanded').addClass('c-tree__item--expandable');
   $('.c-tree__item--expanded').removeClass('mt-tree-selected');
   $('.c-tree__item--expanded').removeClass('c-tree__item--expanded');
   $('#' + $('#' + this.id +' span')[0].id.replace('_span','')).show(); // show this author's nodes
   $('#send-main-to-my-things-button').off();
   $(this).addClass('c-tree__item--expanded');
   $(this).addClass('mt-tree-selected');
   $(this).removeClass('c-tree__item--expandable');
   $('#mainNodeInfoHeader').show();
   $('#haveTriedMainNodeDiv').show();
   if(thisNode.haveTried) {
     $('#main_haveTried').prop('checked', true);
   } else {
     $('#main_haveTried').prop('checked', false);
   }
   $('#mainNodeInfo, #subNodeInfo, #itemInfo').empty();
   $('#mainNodeInfo').append($(this).attr('mainCat'));
 } else {
   // collapse mainCat's nodes
   $('#send-main-to-my-things-button').off();
   $('.mt-sub-cat, .mt-item').hide();
   $('#haveTriedItemDiv').hide();
   $('#haveTriedSubNodeDiv').hide();
   $('#haveTriedMainNodeDiv').hide();
   $('#item_haveTried').prop('checked', false);
   $('#sub_haveTried').prop('checked', false);
   $('#main_haveTried').prop('checked', false);
   $(this).addClass('c-tree__item--expandable');
   $(this).removeClass('c-tree__item--expanded');
   $(this).removeClass('mt-tree-selected');
   $('#mainNodeInfo, #subNodeInfo, #itemInfo').empty();
   $('#mainNodeInfoHeader').hide();
   $('#subNodeInfoHeader').hide();
   $('#itemInfoHeader').hide();
 }
}

var toggleItemTreeItem = function(subNode) {
  $('#sub_haveTried').attr('nodeId', subNode.id);
 if($('#cat_' + subNode.id).hasClass('c-tree__item--expandable')) {
   thisNodeId = $(this).attr('nodeId');
   $('#sub_haveTried').attr('nodeId', thisNodeId);
   // expand items & collapse any others already expanded
   $('[id^="cat_"]').filter('.c-tree__item--expanded').addClass('c-tree__item--expandable');
   $('[id^="cat_"]').filter('.c-tree__item--expanded').removeClass('c-tree__item--expanded');
   $('.mb-book').hide(); // hide all categorie's items first
   $('#haveTriedItemDiv').show();
   $('#haveTriedSubNodeDiv').show();
   $('#haveTriedMainNodeDiv').show();
   if(subNode.haveTried) {
     $('#sub_haveTried').prop('checked', true);
   } else {
     $('#sub_haveTried').prop('checked', false);
   }
   $('#item_haveTried').prop('checked', false);
   $('#' + subNode.id + '_list').show(); // show this author's nodes
   $('#send-sub-to-my-things-button').off();
   $('#subNodeInfoHeader').show();
   $('#cat_' + subNode.id).addClass('c-tree__item--expanded');
   $('#cat_' + subNode.id).addClass('mt-tree-selected');
   $('#cat_' + subNode.id).removeClass('c-tree__item--expandable');
 } else {
   // collapse categorie's items
   $('#send-sub-to-my-things-button').off();
   $('.mt-item').hide();
   $('#haveTriedItemDiv').hide();
   $('#haveTriedSubNodeDiv').hide();
   $('#item_haveTried').prop('checked', false);
   $('#sub_haveTried').prop('checked', false);
   $('#subNodeInfo, #itemInfo').empty();
   $('#subNodeInfoHeader').hide();
   $('#itemInfoHeader').hide();
   $('#cat_' + subNode.id).addClass('c-tree__item--expandable');
   $('#cat_' + subNode.id).removeClass('c-tree__item--expanded');
   $('#cat_' + subNode.id).removeClass('mt-tree-selected');
 }
}

var updateHaveTried = function() {
  var nodeId = $(this).attr('nodeId');
  thisNode = myRootNode.findDescendantById(nodeId);
  var state = false;
  $("html").addClass("waiting");
  if($(this).prop('checked')) {
    // set haveTried to true for this node
    state = true;
  }
  thisNode.prepareMyThingsUpdateNodeQuery({'haveTried':state})
  .then(function() {
    var elementId = $(this).prop('id');
    var nodeId = $(this).attr('nodeId');
    var prefix = elementId.split('_')[0] + '_';
    $("html").removeClass("waiting");
    if(state) {
      $('#' + prefix + nodeId + '_tried').css({'visibility':'visible'});
    } else {
      $('#' + prefix + nodeId + '_tried').css({'visibility':'hidden'});
    }
    $("html").removeClass("waiting");
    var thisNode = myRootNode.findDescendantById(nodeId);
    setAlert('Successfully updated "' + thisNode.name + '"', 'c-alert--success')
    thisNode.haveTried = state;
  }.bind(this))
  .catch(function(err) {
    if(typeof err.responseJSON !== 'undefined') {
      setAlert(err.responseJSON, 'c-alert--error')
    } else {
      setAlert(err, 'c-alert--error')
    }
    $("html").removeClass("waiting");
  })
}

var mainFunction = function() {
  myRootNode = new Node(name='Root');
  myRootNode.type = currentType;
  $('#nodes').empty();
  $('#mainNodeInfo').empty();
  $('#mainNodeInfoHeader').hide();
  $('#subNodeInfo').empty();
  $('#subNodeInfoHeader').hide();
  $('#itemInfo').empty();
  $('#itemInfoHeader').hide();
  $("html").addClass("waiting");
  myRootNode.fillChildNodesFromQuery()
  .then(function() {
    var subNodePromises = [];
    for(var indx=0; indx < myRootNode.children.length; indx++) {
      subNode = myRootNode.children[indx];
      subNodePromises.push(subNode.fillChildNodesFromQuery());
    }
    Promise.all(subNodePromises)
    .then(function(results) {
      $("html").removeClass("waiting");
      loadPage();
    })
  })
}

var loadPage = function() {
  myRootNode.children.forEach(function(mainNode) {
    var subNodes = mainNode.children;
    var subNodesId = mainNode.id + '_list';
    $('#nodes').append('<li id="' + mainNode.id + '" mainCat="' + mainNode.name + '" class="c-tree__item"><i id="main_' + mainNode.id + '_tried" class="fa fa-check"/><i id="main_' + mainNode.id + '_reviewed" class="fa fa-pencil-alt"/><span id="' + subNodesId + '_span">' + mainNode.name + '(' + mainNode.childCount + ')</span></li>');
    $('#nodes').append('<li><ul id="' + subNodesId + '" class="c-tree mt-sub-cat">');
    if(mainNode.haveTried) {
      $('#main_' + mainNode.id + '_tried').css({'visibility':'visible'});
    } else {
      $('#main_' + mainNode.id + '_tried').css({'visibility':'hidden'});
    }
    if(mainNode.haveReviewed) {
      $('#main_' + mainNode.id + '_reviewed').css({'visibility':'visible'});
    } else {
      $('#main_' + mainNode.id + '_reviewed').css({'visibility':'hidden'});
    }
    $('#' + subNodesId).hide();
    $('#' + mainNode.id).attr('nodeId', mainNode.id);
    if(subNodes.length > 0) {
      $('#' + mainNode.id).addClass('c-tree__item--expandable');
      $('#' + mainNode.id).click(toggleCategoryTreeItem);
    }
    subNodes.forEach(function(subNode) {;
      $('#' + subNodesId).append('<li id="cat_' + subNode.id + '" class="c-tree__item"><i id="sub_' + subNode.id + '_tried" class="fa fa-check"/><i id="sub_' + subNode.id + '_reviewed" class="fa fa-pencil-alt"/><span id="cat_' + subNode.id + '_span">' + subNode.name + ' (' + subNode.childCount + ')</span></li>');
      $('#' + subNodesId).append('<li><ul id="' + subNode.id + '_list" class="c-tree mt-item">');
      $('#sub_haveTried').attr('nodeId', subNode.id);
      if(subNode.haveTried) {
        $('#sub_' + subNode.id + '_tried').css({'visibility':'visible'});
      } else {
        $('#sub_' + subNode.id + '_tried').css({'visibility':'hidden'});
      }
      if(subNode.haveReviewed) {
        $('#sub_' + subNode.id + '_reviewed').css({'visibility':'visible'});
      } else {
        $('#sub_' + subNode.id + '_reviewed').css({'visibility':'hidden'});
      }
      if(subNode.childCount > 0) {
        $('#cat_' + subNode.id).addClass('c-tree__item--expandable');
        $('#cat_' + subNode.id).click(function() {
          var subNodeId = this.id.replace('cat_', '');
          $('#subNodeInfo').empty();
          $('#itemInfo').empty();
          $('#subNodeInfo').append('<p>' + subNode.name + '</p>');
          $('#subNodeInfo').append('<p>' + subNode.description + '</p>');
          $('.c-tree__item[id^="item_"]').remove();
          if($(this).hasClass('c-tree__item--expandable')) {
            $("html").addClass("waiting");
            subNode.fillChildNodesFromQuery()
            .then( function () {
              $("html").removeClass("waiting");
              $('#' + subNodeId + '_list').empty();
              subNode.children.forEach(function(item) {
                var subTitle = ''
                if('subtitle' in item.nodeInfo) {
                  subTitle = ' - ' + item.nodeInfo['subtitle'];
                }
                $('#' + subNodeId + '_list').append('<li id="item_' + item.id + '" class="c-tree__item"><i id="item_' + item.id + '_tried" class="fa fa-check"/><i id="item_' + item.id + '_reviewed" class="fa fa-pencil-alt"/><span id="item_' + item.id + '_span">' + item.name + subTitle + '</span></li>');
                if(item.haveTried) {
                  $('#item_' + item.id + '_tried').css({'visibility':'visible'});
                  $('#item_haveTried').prop('checked', true);
                } else {
                  $('#item_' + item.id + '_tried').css({'visibility':'hidden'});
                }
                if(item.haveReviewed) {
                  $('#item_' + item.id + '_reviewed').css({'visibility':'visible'});
                } else {
                  $('#item_' + item.id + '_reviewed').css({'visibility':'hidden'});
                }
                $('#item_' + item.id).click(function() {
                  var itemId = this.id.replace('item_','');
                  var thisItem = subNode.findChildById(itemId);
                  if(thisItem.haveTried) {
                    $('#item_' + itemId + '_tried').removeClass('icon-invisible');
                    $('#item_haveTried').prop('checked', true);
                  } else {
                    $('#item_' + itemId + '_tried').addClass('icon-invisible');
                    $('#item_haveTried').prop('checked', false);
                  }
                  $('#item_haveTried').attr('nodeId', itemId);
                  $('#itemInfo').empty();
                  $('.mt-item-selected').removeClass('mt-item-selected');
                  $('#item_' + itemId).addClass('mt-item-selected');
                  $('#itemInfoHeader').show();
                  $('#itemInfo').append(item.name + ': ' + thisItem.nodeInfo['authors'][0]);
                  if(typeof thisItem.nodeInfo['description'] !== 'undefined') {
                    $('#itemInfo').append('<p>Description: ' + thisItem.nodeInfo['description'] + '</p>');
                  }
                  if(typeof thisItem.nodeInfo['googleLink'] !== 'undefined') {
                    $('#itemInfo').append('<p>Google Link: <a href="' + thisItem.nodeInfo['googleLink'] + '" target="_blank">Google Link</a></p>');
                  }
                  if(typeof thisItem.userInfo !== 'undefined' && typeof thisItem.userInfo.review !== 'undefined') {
                    $('#itemInfo').append('<p>My Review: (' + thisItem.userInfo.review.rating + ') '  + thisItem.userInfo.review.content + '</p>');
                  }
                  $('#haveTriedItemDiv').show();
                }); // click function for each item
              }); // .forEach item
              toggleItemTreeItem(subNode);
            }); // .then after getting items
          } else {
            toggleItemTreeItem(subNode);
          }
          // toggleItemTreeItem(subCat);
        }); // subcategory click function
      } // if the subcategory has items in it
      $('#' + subNodesId).append('</ul></li>'); // end of book c-tree ul
    }); // .forEach mainCat's subCat
  }); // .forEach myRootNode.items
}

$(window).on('load', function(){
    authorizeButton = document.getElementById('authorize-button');
    signoutButton = document.getElementById('signout-button');
    processButton = document.getElementById('process-button');

    $('#item_haveTried').on('change', updateHaveTried);
    $('#sub_haveTried').on('change', updateHaveTried);
    $('#main_haveTried').on('change', updateHaveTried);
    $('#alertBox').append(defaultAlert);
    var canvasWidth = Math.floor(document.getElementsByTagName('html')[0].clientWidth);
    var canvasHeight = Math.floor(document.getElementsByTagName('html')[0].clientHeight);
    var alertHeight = $('#alertBox').outerHeight();
    $('#nodesDiv').css({'height':canvasHeight - alertHeight, 'overflow':'auto'});
    Promise.resolve($.ajax({
      cache: false,
      url: "static/my_books/.secrets.js",
      dataType: "json"
    }))
    .then(function(jsonSecrets) {
      secrets = jsonSecrets;
      //handleClientLoad();
      enableProcessButton();
    })
    .catch(function(err) {
      console.log('error getting secrets ' + err + '\n' + err.stack);
    }); // .then after getting secrets
});
