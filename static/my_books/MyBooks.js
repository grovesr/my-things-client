//"use strict";
// Global Variables
var defaultAlert = "My Things";
var myThings = new Things();
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

Things.prototype.findSubCat = function(key){
  var foundSubCat = null;
  var theseCats = this;
  Object.keys(this.items).forEach(function (subCat) {
    if(key in theseCats.items[subCat]) {
      foundSubCat = theseCats.items[subCat][key];
    }
  });
  return foundSubCat;
}

Things.prototype.getSubCats = function(){
  var query = "https://www.googleapis.com/books/v1/users/" + this.users + "/bookshelves?access_token=" + this.access_token;
  return Promise.resolve($.getJSON(query)).then(this.fillSubCats.bind(this));
}

Bookshelves.prototype.fillSubCats = function(data){
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
}

// object to hold a single subThing
function SubCat() {
  this.users = null;
  this.access_token;
  this.kind = null;
  this.id = null;
  this.items = {};
  this.totlItems = 0;
  this.selfLink = null;
  this.title = null;
  this.mainCat = '';
  this.subCat = '';
  this.access = null;
  this.updated = null;
  this.created = null;
  this.itemCount = null;
  this.itemsLastUpdated = null;
};

SubCat.prototype.getSubCat = function(data) {
  this.kind = data['kind'];
  this.id = data['id'];
  this.items = {};
  this.selfLink = data['selfLink'];
  this.title = data['title'];
  if(this.id > 1000) {
    var splitIndex = this.title.indexOf('-');
    if(splitIndex) {
      this.mainCat = this.title.slice(0, splitIndex-1);
      this.subCat = this.title.slice(splitIndex + 2);
    }
  } else {
    this.mainCat = 'System Bookshelves';
    this.subCat = this.title;
  }
  this.access = data['access'];
  this.updated = data['updated'];
  this.created = data['created'];
  this.itemCount = data['volumeCount'];
  this.itemsLastUpdated = data['volumesLastUpdated'];
}

SubCat.prototype.fillSubCat = function(data){
  this.totalItems = data['totalItems'];
  this.items = {};
  var thisSubCat = this;
  for(var indx = 0; indx < data['items'].length; indx++) {
    // for each volume retrieved
    var thisItem = new Item();
    thisItem.fillItem(data['items'][indx]);
    thisSubCat.items[thisItem.id] = thisItem;
  }
}

// object to hold a single item
function Item() {
  this.kind = null;
  this.id = null;
  this.etag = null
  this.selfLink = null;
  this.itemInfo = {};
};

Item.prototype.getItem = function(data) {
  this.id = data['id'];
  var query = "https://www.googleapis.com/books/v1/volumes/" + this.id + "?access_token=" + this.access_token;
  return Promise.resolve($.getJSON(query)).then(this.fillItem.bind(this));
}

Book.prototype.fillItem = function(data) {
  this.id = data['id'];
  this.kind = data['kind'];
  this.etag = data['etag'];
  this.selfLink = data['selfLink'];
  this.itemInfo = data['volumeInfo'];
}

var toggleCategoryTreeItem = function() {
  if($(this).hasClass('c-tree__item--expandable')) {
    // expand author's categories & collapse any others already expanded
    $('.mt-sub-cat, .mt-item').hide(); // hide all author's categories first
    $('.c-tree__item--expanded').addClass('c-tree__item--expandable');
    $('.c-tree__item--expanded').removeClass('c-tree__item--expanded');
    $('#' + $('#' + this.id +' span')[0].id.replace('_span','')).show(); // show this author's categories
    $(this).addClass('c-tree__item--expanded');
    $(this).addClass('mt-tree-selected');
    $(this).removeClass('c-tree__item--expandable');
    $('#mainCatInfo, #subCatInfo, #itemInfo').empty();
    $('#mainCat').append($(this).attr('subCatKey'));
  } else {
    // collapse author's categories
    $('.mt-sub-cat, .mt-item').hide();
    $(this).addClass('c-tree__item--expandable');
    $(this).removeClass('c-tree__item--expanded');
    $(this).removeClass('mt-tree-selected');
    $('#mainCatInfo, #subCatInfo, #itemInfo').empty();
  }
}

var toggleItemTreeItem = function(itemId) {
  if($('#' + itemId).hasClass('c-tree__item--expandable')) {
    // expand items & collapse any others already expanded
    $('[id^="cat_"]').filter('.c-tree__item--expanded').addClass('c-tree__item--expandable');
    $('[id^="cat_"]').filter('.c-tree__item--expanded').removeClass('c-tree__item--expanded');
    $('.mb-book').hide(); // hide all categorie's items first
    $('#' + itemId.replace('cat_','') + '_list').show(); // show this author's categories
    $('#' + itemId).addClass('c-tree__item--expanded');
    $('#' + itemId).addClass('mt-tree-selected');
    $('#' + itemId).removeClass('c-tree__item--expandable');
  } else {
    // collapse categorie's books
    $('.mt-item').hide();
    $('#subCatInfo, #itemInfo').empty();
    $('#' + itemId).addClass('c-tree__item--expandable');
    $('#' + itemId).removeClass('c-tree__item--expanded');
    $('#' + itemId).removeClass('mt-tree-selected');
  }
}

$(document).ready(function(){
    $('#alertBox').append(defaultAlert);
    var canvasWidth = Math.floor(document.getElementsByTagName('html')[0].clientWidth);
    var canvasHeight = Math.floor(document.getElementsByTagName('html')[0].clientHeight);
    var alertHeight = $('#alertBox').outerHeight();
    $('#categoriesDiv').css({'height':canvasHeight - alertHeight, 'overflow':'auto'});
    var secrets;
    Promise.resolve($.getJSON("static/my_books/constants.js"))
    .then(function(secrets) {
      myCategories = new Bookshelves(secrets['users'],secrets['access_token']);
      myCategories.getSubCats().then(function() {
        Object.keys(myCategories.items).forEach(function(MainCat) {
          var mainCatSubCats = myCategories.items[mainCat];
          var numItemsInSystemMainCat = '';
          var mainCatNameId = mainCat.replace(/ /g,'_');
          var mainCatId = mainCatNameId + '_list';
          $('#categories').append('<li id="' + mainCatNameId + '" mainCatSubCatKey="' + mainCat + '" class="c-tree__item"><span id="' + mainCatId + '_span">' + mainCat + '</span></li>');
          $('#categories').append('<li><ul id="' + mainCatId + '" class="c-tree mt-sub-cat">');
          $('#' + mainCatId).hide();
          if(Object.keys(mainCatSubCats).length > 0) {
            $('#' + mainCatNameId).addClass('c-tree__item--expandable');
            $('#' + mainCatNameId).click(toggleCategoryTreeItem);
          }
          Object.keys(mainCatSubCats).forEach(function(catKey) {;
            var category = mainCatSubCats[catKey];
            $('#' + authorId).append('<li id="cat_' + category.id + '" class="c-tree__item"><span id="cat_' + mainCatId + '_span">' + category.category + ' (' + category.itemCount + ')</span></li>');
            $('#' + authorId).append('<li><ul id="' + category.id + '_list" class="c-tree mt-item">');
            if(category.itemCount > 0) {
              $('#cat_' + category.id).addClass('c-tree__item--expandable');
              $('#cat_' + category.id).click(function() {
                var categoryId = this.id.replace('cat_', '');
                var category = myCategories.findSubCat(categoryId);
                $('#categoryInfo').empty();
                $('#categoryInfo').append(category.category);
                $('[id^="item_"]').remove();
                var query = "https://www.googleapis.com/books/v1/users/" + category.users + "/bookshelves/" + category.id + "/volumes?access_token=" + category.access_token;
                .then( function () {
                  Object.keys(category.items).forEach(function(bookKey) {
                    item = category.items[bookKey];
                    $('#' + categoryId + '_list').append('<li id="item_' + item.id + '" class="c-tree__item"><span id="item_' + book.id + '_span">' + item.itemInfo['title'] + '</span></li>');
                    $('#item_' + item.id).click(function() {
                      var itemId = this.id.replace('item_','');
                      $('#itemInfo').empty();
                      $('.mt-item-selected').removeClass('mt-item-selected');
                      $('#item_' + itemId).addClass('mt-item-selected');
                      $('#itemInfo').append(category.items[itemId].itemInfo['title']);
                    }); // click function for each item
                  }); // .forEach item
                  toggleItemTreeItem(this.id);
                }.bind(this)); // .then after getting items
              }); // subcategory click function
            } // if the subcategory has items in it
            $('#' + mainCatId).append('</ul></li>'); // end of book c-tree ul
          }); // .forEach mainCat's subCat
        }); // .forEach myCategories.items
      }); // .then after getting myCategories
    }); // .then after getting secrets
});
