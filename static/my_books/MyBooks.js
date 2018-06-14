//"use strict";
// Global Variables
var defaultAlert = "My Bookshelves";
var myBookshelves = new Bookshelves();
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
function Bookshelves(users = "", access_token = "") {
  this.users = users;
  this.access_token = access_token;
  this.kind = '';
  this.items = {};
  this.numShelves = 0;
};

Bookshelves.prototype.findBookshelf = function(key){
  var foundBookshelf = null;
  var theseBookshelves = this;
  Object.keys(this.items).forEach(function (author) {
    if(key in theseBookshelves.items[author]) {
      foundBookshelf = theseBookshelves.items[author][key];
    }
  });
  return foundBookshelf;
}

Bookshelves.prototype.getBookshelves = function(){
  var query = "https://www.googleapis.com/books/v1/users/" + this.users + "/bookshelves?access_token=" + this.access_token;
  return Promise.resolve($.getJSON(query)).then(this.fillBookshelves.bind(this));
}

Bookshelves.prototype.fillBookshelves = function(data){
  // data is the JSON result of a bookshelves query to Google Books API
  this.items = {};
  this.kind = data['kind'];
  for(var indx = 0; indx < data['items'].length; indx++) {
    // loop through each bookshelf returned
    var thisBookshelf = new Bookshelf();
    thisBookshelf.users = this.users;
    thisBookshelf.access_token = this.access_token;
    thisBookshelf.getBookshelf(data['items'][indx]);
    // load the bookshelf with meta data
    if(!(thisBookshelf.author in this.items)) {
      // if the author hasn't already been loaded into the dictionary
      // create an dictionary in which to place the bookshelves for this author
      this.items[thisBookshelf.author] = {};
    }
    this.items[thisBookshelf.author][thisBookshelf.id]=thisBookshelf;
    this.numShelves++;
  }
}

// object to hold a single bookshelf
function Bookshelf() {
  this.users = null;
  this.access_token;
  this.kind = null;
  this.id = null;
  this.items = {};
  this.totlItems = 0;
  this.selfLink = null;
  this.title = null;
  this.author = '';
  this.category = '';
  this.access = null;
  this.updated = null;
  this.created = null;
  this.volumeCount = null;
  this.volumesLastUpdated = null;
};

Bookshelf.prototype.getBookshelf = function(data) {
  this.kind = data['kind'];
  this.id = data['id'];
  this.items = {};
  this.selfLink = data['selfLink'];
  this.title = data['title'];
  if(this.id > 1000) {
    var splitIndex = this.title.indexOf('-');
    if(splitIndex) {
      this.author = this.title.slice(0, splitIndex-1);
      this.category = this.title.slice(splitIndex + 2);
    }
  } else {
    this.author = 'System Bookshelves';
    this.category = this.title;
  }
  this.access = data['access'];
  this.updated = data['updated'];
  this.created = data['created'];
  this.volumeCount = data['volumeCount'];
  this.volumesLastUpdated = data['volumesLastUpdated'];
}

Bookshelf.prototype.fillBookshelf = function(data){
  this.totalItems = data['totalItems'];
  this.items = {};
  var thisBookshelf = this;
  for(var indx = 0; indx < data['items'].length; indx++) {
    // for each volume retrieved
    var thisBook = new Book();
    thisBook.fillBook(data['items'][indx]);
    thisBookshelf.items[thisBook.id] = thisBook;
  }
}

// object to hold a single book
function Book() {
  this.kind = null;
  this.id = null;
  this.etag = null
  this.selfLink = null;
  this.volumeInfo = {};
};

Book.prototype.getBook = function(data) {
  this.id = data['id'];
  var query = "https://www.googleapis.com/books/v1/volumes/" + this.id + "?access_token=" + this.access_token;
  return Promise.resolve($.getJSON(query)).then(this.fillBook.bind(this));
}

Book.prototype.fillBook = function(data) {
  this.id = data['id'];
  this.kind = data['kind'];
  this.etag = data['etag'];
  this.selfLink = data['selfLink'];
  this.volumeInfo = data['volumeInfo'];
}

var toggleCategoryTreeItem = function() {
  if($(this).hasClass('c-tree__item--expandable')) {
    // expand author's categories & collapse any others already expanded
    $('.mb-author-cat, .mb-book').hide(); // hide all author's categories first
    $('.c-tree__item--expanded').addClass('c-tree__item--expandable');
    $('.c-tree__item--expanded').removeClass('c-tree__item--expanded');
    $('#' + $('#' + this.id +' span')[0].id.replace('_span','')).show(); // show this author's categories
    $(this).addClass('c-tree__item--expanded');
    $(this).addClass('mb-tree-selected');
    $(this).removeClass('c-tree__item--expandable');
    $('#authorInfo, #categoryInfo, #bookInfo').empty();
    $('#authorInfo').append($(this).attr('authorBookshelfKey'));
  } else {
    // collapse author's categories
    $('.mb-author-cat, .mb-book').hide();
    $(this).addClass('c-tree__item--expandable');
    $(this).removeClass('c-tree__item--expanded');
    $(this).removeClass('mb-tree-selected');
    $('#authorInfo, #categoryInfo, #bookInfo').empty();
  }
}

var toggleBookTreeItem = function(itemId) {
  if($('#' + itemId).hasClass('c-tree__item--expandable')) {
    // expand books & collapse any others already expanded
    $('[id^="cat_"]').filter('.c-tree__item--expanded').addClass('c-tree__item--expandable');
    $('[id^="cat_"]').filter('.c-tree__item--expanded').removeClass('c-tree__item--expanded');
    $('.mb-book').hide(); // hide all categorie's books first
    $('#' + itemId.replace('cat_','') + '_list').show(); // show this author's categories
    $('#' + itemId).addClass('c-tree__item--expanded');
    $('#' + itemId).addClass('mb-tree-selected');
    $('#' + itemId).removeClass('c-tree__item--expandable');
  } else {
    // collapse categorie's books
    $('.mb-book').hide();
    $('#categoryInfo, #bookInfo').empty();
    $('#' + itemId).addClass('c-tree__item--expandable');
    $('#' + itemId).removeClass('c-tree__item--expanded');
    $('#' + itemId).removeClass('mb-tree-selected');
  }
}

$(document).ready(function(){
    $('#alertBox').append(defaultAlert);
    var canvasWidth = Math.floor(document.getElementsByTagName('html')[0].clientWidth);
    var canvasHeight = Math.floor(document.getElementsByTagName('html')[0].clientHeight);
    var alertHeight = $('#alertBox').outerHeight();
    $('#bookshelvesDiv').css({'height':canvasHeight - alertHeight, 'overflow':'auto'});
    var secrets;
    Promise.resolve($.getJSON("static/my_books/constants.js"))
    .then(function(secrets) {
      myBookshelves = new Bookshelves(secrets['users'],secrets['access_token']);
      myBookshelves.getBookshelves().then(function() {
        Object.keys(myBookshelves.items).forEach(function(author) {
          var authorBookshelves = myBookshelves.items[author];
          var numBooksInSystemBookshelf = '';
          var authorNameId = author.replace(/ /g,'_');
          var authorId = authorNameId + '_list';
          $('#bookshelves').append('<li id="' + authorNameId + '" authorBookshelfKey="' + author + '" class="c-tree__item"><span id="' + authorId + '_span">' + author + '</span></li>');
          $('#bookshelves').append('<li><ul id="' + authorId + '" class="c-tree mb-author-cat">');
          $('#' + authorId).hide();
          if(Object.keys(authorBookshelves).length > 0) {
            $('#' + authorNameId).addClass('c-tree__item--expandable');
            $('#' + authorNameId).click(toggleCategoryTreeItem);
          }
          Object.keys(authorBookshelves).forEach(function(bookshelfKey) {;
            var bookshelfCategory = authorBookshelves[bookshelfKey];
            $('#' + authorId).append('<li id="cat_' + bookshelfCategory.id + '" class="c-tree__item"><span id="cat_' + authorId + '_span">' + bookshelfCategory.category + ' (' + bookshelfCategory.volumeCount + ')</span></li>');
            $('#' + authorId).append('<li><ul id="' + bookshelfCategory.id + '_list" class="c-tree mb-book">');
            if(bookshelfCategory.volumeCount > 0) {
              $('#cat_' + bookshelfCategory.id).addClass('c-tree__item--expandable');
              $('#cat_' + bookshelfCategory.id).click(function() {
                var bookshelfId = this.id.replace('cat_', '');
                var bookshelf = myBookshelves.findBookshelf(bookshelfId);
                //var bookshelf = myBookshelves.items[bookshelfId];
                $('#categoryInfo').empty();
                $('#categoryInfo').append(bookshelf.category);
                $('[id^="book_"]').remove();
                var query = "https://www.googleapis.com/books/v1/users/" + bookshelf.users + "/bookshelves/" + bookshelf.id + "/volumes?access_token=" + bookshelf.access_token;
                Promise.resolve($.getJSON(query)).then(bookshelf.fillBookshelf.bind(bookshelf))
                .then( function () {
                  Object.keys(bookshelf.items).forEach(function(bookKey) {
                    book = bookshelf.items[bookKey];
                    $('#' + bookshelfId + '_list').append('<li id="book_' + book.id + '" class="c-tree__item"><span id="book_' + book.id + '_span">' + book.volumeInfo['title'] + '</span></li>');
                    $('#book_' + book.id).click(function() {
                      var bookId = this.id.replace('book_','');
                      $('#bookInfo').empty();
                      $('.mb-book-selected').removeClass('mb-book-selected');
                      $('#book_' + bookId).addClass('mb-book-selected');
                      $('#bookInfo').append(bookshelf.items[bookId].volumeInfo['title']);
                    }); // click function for each book
                  }); // .forEach book
                  toggleBookTreeItem(this.id);
                }.bind(this)); // .then after getting books
              }); // bookshelf category click function
            } // if the category has books in it
            $('#' + authorId).append('</ul></li>'); // end of book c-tree ul
          }); // .forEach author bookshelf
        }); // .forEach myBookshelves.items
      }); // .then after getting myBookshelves
    }); // .then after getting secrets
});
