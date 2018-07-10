
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
var myCategories = null;
var authorizeButton = null;
var signoutButton = null;
var processButton = null;
var sendMainToMyThingsButton = null;
var sendSubToMyThingsButton = null;
var secrets;
var currentUser = 'grovesr';
var currentUserPassword = 'zse45rdx';

function handleClientLoad() {
 // Load the API client and auth2 library
 gapi.load('client:auth2', initClient);
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
  item['addData']['nodeInfo']['categories'] = item.itemInfo['categories'];
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
    $('#send-main-to-my-things-button').on('click', myCategories.sendToMyThings.bind(cat));
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
 if($(this).hasClass('c-tree__item--expandable')) {
   // expand mainCat's categories & collapse any others already expanded
   $('#haveReadDiv').hide();
   $('#subCatInfoHeader').hide();
   $('.mt-sub-cat, .mt-item').hide(); // hide all author's categories first
   $('.c-tree__item--expanded').addClass('c-tree__item--expandable');
   $('.c-tree__item--expanded').removeClass('mt-tree-selected');
   $('.c-tree__item--expanded').removeClass('c-tree__item--expanded');
   $('#' + $('#' + this.id +' span')[0].id.replace('_span','')).show(); // show this author's categories
   $('#send-main-to-my-things-button').off();
   myCategories.checkIfInMyThings($(this).text());
   $(this).addClass('c-tree__item--expanded');
   $(this).addClass('mt-tree-selected');
   $(this).removeClass('c-tree__item--expandable');
   $('#mainCatInfoHeader').show();
   $('#mainCatInfo, #subCatInfo, #itemInfo').empty();
   $('#mainCatInfo').append($(this).attr('mainCat'));
 } else {
   // collapse mainCat's categories
   $('#send-main-to-my-things-button').off();
   $('.mt-sub-cat, .mt-item').hide();
   $('#haveReadDiv').hide();
   $(this).addClass('c-tree__item--expandable');
   $(this).removeClass('c-tree__item--expanded');
   $(this).removeClass('mt-tree-selected');
   $('#mainCatInfo, #subCatInfo, #itemInfo').empty();
   $('#mainCatInfoHeader').hide();
 }
}

var toggleItemTreeItem = function(subCat) {
 if($('#cat_' + subCat.id).hasClass('c-tree__item--expandable')) {
   // expand items & collapse any others already expanded
   $('[id^="cat_"]').filter('.c-tree__item--expanded').addClass('c-tree__item--expandable');
   $('[id^="cat_"]').filter('.c-tree__item--expanded').removeClass('c-tree__item--expanded');
   $('.mb-book').hide(); // hide all categorie's items first
   $('#haveReadDiv').hide();
   $('#haveReadBook').prop('checked', false);
   $('#' + subCat.id + '_list').show(); // show this author's categories
   $('#send-sub-to-my-things-button').off();
   myCategories.items[subCat.mainCat][subCat.id].checkIfInMyThings();
   $('#subCatInfoHeader').show();
   $('#cat_' + subCat.id).addClass('c-tree__item--expanded');
   $('#cat_' + subCat.id).addClass('mt-tree-selected');
   $('#cat_' + subCat.id).removeClass('c-tree__item--expandable');
 } else {
   // collapse categorie's items
   $('#send-sub-to-my-things-button').off();
   $('.mt-item').hide();
   $('#haveReadDiv').hide();
   $('#haveReadBook').prop('checked', false);
   $('#subCatInfo, #itemInfo').empty();
   $('#subCatInfoHeader').hide();
   $('#cat_' + subCat.id).addClass('c-tree__item--expandable');
   $('#cat_' + subCat.id).removeClass('c-tree__item--expanded');
   $('#cat_' + subCat.id).removeClass('mt-tree-selected');
 }
}

var updateHaveRead = function() {
  var item = myCategories.findItemByKey($(this).attr('itemId'));
  if($('#haveReadBook').prop('checked')) {
    // add this book to the Have read category
    return gapi.client.books.mylibrary.bookshelves.addVolume({
     'volumeId': $(this).attr('itemId'),
     'shelf':4
    })
   .then(// update myCategories and haveRead list
     function() {
       return myCategories.findSubCatByKey(4).fillSubCatFromQuery(true)
     })
   .then(function () {
     var subCat = myCategories.findSubCatByKey(4);
     if(subCat.itemCount > 0) {
       if($('#cat_4').hasClass('c-tree__item--expanded')) {

       } else {
         $('#cat_4').addClass('c-tree__item--expandable');
       }
     } else {
       $('#cat_4').removeClass('c-tree__item--expandable');
       $('#cat_4').removeClass('c-tree__item--expanded');
     }
     $('#cat_4_list').append('<li id="item_' + item.id + '" class="c-tree__item"><i id="item_' + item.id + '_read" class="fa fa-check"/><i id="item_' + item.id + '_reviewed" class="fa fa-pencil-alt"><span id="item_' + item.id + '_span">' + item.itemInfo['title'] + '</span></li>');
     $('#cat_4').empty();
     $('#cat_4').append('<span id="cat_' + subCat.id + '_span">' + subCat.subCat + ' (' + subCat.itemCount + ')</span>');
     if(myCategories.findSubCatByKey(4).contains(item.id)) {
       $('#item_' + item.id + '_read').css({'visibility':'visible'});
     } else {
       $('#item_' + item.id + '_read').css({'visibility':'hidden'});
     }
     if(myCategories.findSubCatByKey(5).contains(item.id)) {
       $('#item_' + item.id + '_reviewed').css({'visibility':'visible'});
     } else {
       $('#item_' + item.id + '_reviewed').css({'visibility':'hidden'});
     }
   }.bind(this))
   .catch(function(err) {
     console.log('error in gapi call' + err + '\n' + err.stack);
   });
  } else {
    // remove this book from the Have read category
    return gapi.client.books.mylibrary.bookshelves.removeVolume({
     'volumeId': $(this).attr('itemId'),
     'shelf':4
    })
   .then(// update myCategories and haveRead list
       function() {
         return myCategories.findSubCatByKey(4).fillSubCatFromQuery(true)
       })
    .then(function() {
      var subCat = myCategories.findSubCatByKey(4);
      if(subCat.itemCount > 0) {
        if($('#cat_4').hasClass('c-tree__item--expanded')) {

        } else {
          $('#cat_4').addClass('c-tree__item--expandable');
        }
      } else {
        $('#cat_4').removeClass('c-tree__item--expandable');
        $('#cat_4').removeClass('c-tree__item--expanded');
      }
      $('#item_' + item.id).remove();
      $('#cat_4').empty();
      $('#cat_4').append('<span id="cat_' + subCat.id + '_span">' + subCat.subCat + ' (' + subCat.itemCount + ')</span>');
      //$('#item_' + item.id + '_read').addClass('icon-blank');
      $('#item_' + item.id + '_read').css({'visibility':'visible'});
    })
   .catch(function(err) {
     console.log('error in gapi call' + err + '\n' + err.stack);
   });
  }
}

var mainFunction = function() {
  if(myCategories === null) {
    // starting out fresh
    myCategories = new MainCat(secrets['GBOOKS_USER_ID'],secrets['MY_BOOKS_CLIENT_ID']);
  } else {
    $('#categories').empty();
    $('#mainCatInfo').empty();
    $('#subCatInfo').empty();
    $('#itemInfo').empty();
  }
  var arrayOfPromises;
  myCategories.fillSubCatsFromQuery()
  .then(function() {
    return myCategories.findSubCatByKey(4).fillSubCatFromQuery(false)})
  .then(function() {
    myCategories.findSubCatByKey(5).fillSubCatFromQuery(false)})
  .catch(function(err) {
      console.log(err);
    })
  .then(loadPage); // .then after getting myCategories
}

var loadPage = function(resolve) {
  Object.keys(myCategories.items).forEach(function(mainCat) {
    var subCats = myCategories.items[mainCat];
    var mainCatNameId = mainCat.replace(/ /g,'_');
    var subCatsId = mainCatNameId + '_list';
    $('#categories').append('<li id="' + mainCatNameId + '" mainCat="' + mainCat + '" class="c-tree__item"><span id="' + subCatsId + '_span">' + mainCat + '</span></li>');
    $('#categories').append('<li><ul id="' + subCatsId + '" class="c-tree mt-sub-cat">');
    $('#' + subCatsId).hide();
    if(Object.keys(subCats).length > 0) {
      $('#' + mainCatNameId).addClass('c-tree__item--expandable');
      $('#' + mainCatNameId).click(toggleCategoryTreeItem);
    }
    Object.keys(subCats).forEach(function(catKey) {;
      var subCat = subCats[catKey];
      $('#' + subCatsId).append('<li id="cat_' + subCat.id + '" class="c-tree__item"><span id="cat_' + subCat.id + '_span">' + subCat.subCat + ' (' + subCat.itemCount + ')</span></li>');
      $('#' + subCatsId).append('<li><ul id="' + subCat.id + '_list" class="c-tree mt-item">');
      /* this doesn't work because we haven't retrieved all volumes from all bookshelves
         this would entail too many google api calls
      if(myCategories.subCatHasReadByKey(mainCat, subCat.id)) {
        $('#cat_' + subCat.id + '_read').addClass('fa fa-check');
      }
      if(myCategories.subCatHasReviewedByKey(mainCat, subCat.id)) {
        $('#cat_' + subCat.id + '_reviewed').addClass('fa fa-pencil-alt');
      }
      */
      if(subCat.itemCount > 0) {
        $('#cat_' + subCat.id).addClass('c-tree__item--expandable');
        $('#cat_' + subCat.id).click(function() {
          var subCatId = this.id.replace('cat_', '');
          var subCat = myCategories.findSubCatByKey(subCatId);
          $('#subCatInfo').empty();
          $('#itemInfo').empty();
          $('#subCatInfo').append('<p>' + subCat.subCat + '</p>');
          $('#subCatInfo').append('<p>' + subCat.description + '</p>');
          $('[id^="item_"]').remove();
          if($(this).hasClass('c-tree__item--expandable')) {
            subCat.fillSubCatFromQuery(false)
            .then( function () {
              Object.keys(subCat.items).forEach(function(itemKey) {
                var subTitle = ''
                item = subCat.items[itemKey];
                if('subtitle' in item.itemInfo) {
                  subTitle = ' - ' + item.itemInfo['subtitle'];
                }
                $('#' + subCatId + '_list').append('<li id="item_' + item.id + '" class="c-tree__item"><i id="item_' + item.id + '_read" class="fa fa-check"/><i id="item_' + item.id + '_reviewed" class="fa fa-pencil-alt"/><span id="item_' + item.id + '_span">' + item.itemInfo['title'] + subTitle + '</span></li>');
                if(myCategories.findSubCatByKey(4).contains(itemKey)) {
                  $('#item_' + item.id + '_read').css({'visibility':'visible'});
                  $('#haveReadBook').prop('checked', true);
                } else {
                  $('#item_' + item.id + '_read').css({'visibility':'hidden'});
                }
                if(myCategories.findSubCatByKey(5).contains(itemKey)) {
                  $('#item_' + item.id + '_reviewed').css({'visibility':'visible'});
                } else {
                  $('#item_' + item.id + '_reviewed').css({'visibility':'hidden'});
                }
                $('#item_' + item.id).click(function() {
                  var itemId = this.id.replace('item_','');
                  if(myCategories.findSubCatByKey(4).contains(itemId)) {
                    $('#item_' + itemId + '_read').removeClass('icon-invisible');
                    $('#haveReadBook').prop('checked', true);
                  } else {
                    $('#item_' + itemId + '_read').addClass('icon-invisible');
                    $('#haveReadBook').prop('checked', false);
                  }
                  $('#haveReadBook').attr('itemId', itemId);
                  $('#itemInfo').empty();
                  $('.mt-item-selected').removeClass('mt-item-selected');
                  $('#item_' + itemId).addClass('mt-item-selected');
                  $('#itemInfoHeader').show();
                  $('#itemInfo').append(subCat.items[itemId].itemInfo['title'] + ': ' + subCat.items[itemId].itemInfo['authors'][0]);
                  if(typeof subCat.items[itemId].itemInfo['description'] !== 'undefined') {
                    $('#itemInfo').append('<p>Description: ' + subCat.items[itemId].itemInfo['description'] + '</p>');
                  }
                  if(typeof subCat.items[itemId].userInfo.review !== 'undefined') {
                    $('#itemInfo').append('<p>My Review: (' + subCat.items[itemId].userInfo.review.rating + ') '  + subCat.items[itemId].userInfo.review.content + '</p>');
                  }
                  $('#haveReadDiv').show();
                }); // click function for each item
              }); // .forEach item
              toggleItemTreeItem(subCat);
            }); // .then after getting items
          } else {
            toggleItemTreeItem(subCat);
          }
          // toggleItemTreeItem(subCat);
        }); // subcategory click function
      } // if the subcategory has items in it
      $('#' + subCatsId).append('</ul></li>'); // end of book c-tree ul
    }); // .forEach mainCat's subCat
  }); // .forEach myCategories.items
}

$(window).on('load', function(){
    authorizeButton = document.getElementById('authorize-button');
    signoutButton = document.getElementById('signout-button');
    processButton = document.getElementById('process-button');
    sendMainToMyThingsButton = document.getElementById('send-sub-to-my-things-button');
    sendSubToMyThingsButton = document.getElementById('send-sub-to-my-things-button');
    processButton.onclick = mainFunction;

    $('#haveReadBook').on('change', updateHaveRead);
    $('#alertBox').append(defaultAlert);
    var canvasWidth = Math.floor(document.getElementsByTagName('html')[0].clientWidth);
    var canvasHeight = Math.floor(document.getElementsByTagName('html')[0].clientHeight);
    var alertHeight = $('#alertBox').outerHeight();
    $('#categoriesDiv').css({'height':canvasHeight - alertHeight, 'overflow':'auto'});
    Promise.resolve($.ajax({
      cache: false,
      url: "static/my_books/constants.js",
      dataType: "json"
    }))
    .then(function(jsonSecrets) {
      secrets = jsonSecrets;
      handleClientLoad();
    })
    .catch(function(err) {
      console.log('error getting secrets ' + err + '\n' + err.stack);
    }); // .then after getting secrets
});
