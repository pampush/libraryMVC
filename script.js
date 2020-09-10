 
"use strict"

function Event() {
  let events = {};
  let last =  undefined;
  this.on = function(evt, handler) {
    (events[evt] || (events[evt] = [])).push(handler);
  } 
  this.emit = function(evt, ...arg) {
    last = evt;
    for(let item of events[evt])
      item(...arg);
  }

  this.removeLastEventHandler = function() {
    events[last].pop(); // delete event[last]
  }
  
  this.getEvents = function() {
    return {...events};
  }
}

function Model() {
  this.books = new Map();
  this.sortedBooks = new Map();

  this.sort = { // take note that value object in maps are equal (sortedBooks refers to books); 
    default: () => new Map([...this.books]),
    readStatus: () => new Map([...this.books].sort((a, b) => a[1].readStatus - b[1].readStatus)),
  }

  this.addBook = function (formData) {
    const key = Date.now() + Math.floor(Math.random() * 100); // FIXME:  
    this.books.set(key, formData);

    eventEmitter.emit('onBookChange', key, this.books.get(key)); // or formData
  }

  this.deleteBook = function (index) {
    index = this._toNumber(index);
    this.books.delete(index);
  }

  this.changeReadStatus = function (index) {
    index = this._toNumber(index);
    const book = this.books.get(index);
    book.readStatus = !book.readStatus;
  }

  this.sortBooks = function (method) {
    this.sortedBooks.clear(); // prevent memory leak
    this.sortedBooks = this.sort[method](); // false ahead
    eventEmitter.emit('onBooksChange', this.sortedBooks);
  }

  this.bookEdit = function (index, obj) {
    index = this._toNumber(index);
    for(const prop in obj)
      this.books.get(index)[prop] = obj[prop];
  }

  this._toNumber = function (value) {
    if (typeof (value) != 'number')
      return +value;
  }
}

/** 
  * VIEW
  */
function View() {
  this.container = document.querySelector('.grid-container__main');
  this.form = document.querySelector('.modal-form');
  this.createBookButton = document.querySelector('button[value="createBook"]');
  this.modalBox = document.querySelector('.modal');
  this.booksContainer = document.querySelector('.grid-container__main');
  this.sortBookButtons = document.querySelector('.header-sort');

  this.form.addEventListener('submit', e => {
    e.preventDefault();
    const book = this._fetchForm();
    this.modalBox.style = 'none';
    this.form.reset();

    eventEmitter.emit('addBook', book);
  });

  
  this.booksContainer.addEventListener('focusout', (e) => {
      eventEmitter.emit('onBookEdit', this._getBookRoot(e.target).firstElementChild.dataset.index, this._temporaryProperty);
  });

  this.sortBookButtons.addEventListener('click', e => {
    if (e.target.classList.contains('active'))
      return;

    [...e.target.parentNode.children].find((node) => node.classList.contains('active')).classList.remove('active');
    e.target.classList.add('active')

    if (e.target.value == 'default')
      eventEmitter.emit('onBooksSort', 'default');
    else if (e.target.value == 'read-status')
      eventEmitter.emit('onBooksSort', 'readStatus');
  });
  

  this._initLocalListeners = function () {
    this.createBookButton.addEventListener('click', e => {
      this.modalBox.style = 'display: block;';
      this.form.querySelector('input').focus(); // first input 
    });

    this.form.addEventListener('click', e => {
      if (e.target.value == 'close') {
        this.modalBox.style.display = 'none';
        this.form.reset();
      }
    });

    this.booksContainer.addEventListener('input', (e) => {
      this._temporaryProperty = {[e.target.dataset.name]: e.target.textContent}; 
    }); 
  };
  this._initLocalListeners();

  this.booksContainer.addEventListener('click', e => {
    if (e.target.classList.contains('main-item__delete')) {
      this._getBookRoot(e.target).remove();
      eventEmitter.emit('onBookDelete', e.target.parentNode.dataset.index);
    } else
    if (e.target.classList.contains('main-item__readstatus')) {
      e.target.classList.toggle('false');
      eventEmitter.emit('onBookChangeReadStatus', this._getBookRoot(e.target).firstElementChild.dataset.index);
    }
  });

  this._fetchForm = function () {
    const book = {};
    for (const field of this.form.elements) {
      if (field.type == 'text')
        book[field.name] = field.value;
      if (field.type == 'checkbox') {
        if (field.checked)
          book.readStatus = true;
        else
          book.readStatus = false;
      }
    }
    return book;
  }

  this.renderBook = function (key, book) {
    const bookNode = document.createElement('div');
    bookNode.classList.add('main-item__container');
    bookNode.innerHTML = `<div class="main-item" data-index="${key}">
      <div class="main-item__delete">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ff0028" viewBox="0 0 24 24">
          <path class="st0" d="M0,0h24v24H0V0z" fill="none"></path>
          <path d="M12,0C5.4,0,0,5.4,0,12s5.4,12,12,12s12-5.4,12-12S18.6,0,12,0z M17,13H7v-2h10V13z"></path>
        </svg>
        </div>
        <h1 data-name="title" contentEditable="true">${book.title}</h1>
        <h2 data-name="author" contentEditable="true">${book.author}</h2>
        <div class="main-item__pages">
          <span data-name="numberOfPages" contentEditable="true">${book.numberOfPages}</span> 
          <span>pages</span>
        </div>
        <div class="main-item__readstatus-container">
          <div class="main-item__readstatus ${book.readStatus ? '' : false}"></div>
        </div>
    </div>`
    this.container.prepend(bookNode);
  }

  this.renderBooks = function (books) {
    while (this.booksContainer.firstChild) {
      this.booksContainer.removeChild(this.booksContainer.firstChild)
    }

    for (const [key, book] of books) {
      const bookNode = document.createElement('div');
      bookNode.classList.add('main-item__container');
      bookNode.innerHTML = `<div class="main-item" data-index="${key}">
      <div class="main-item__delete">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ff0028" viewBox="0 0 24 24">
          <path class="st0" d="M0,0h24v24H0V0z" fill="none"></path>
          <path d="M12,0C5.4,0,0,5.4,0,12s5.4,12,12,12s12-5.4,12-12S18.6,0,12,0z M17,13H7v-2h10V13z"></path>
        </svg>
        </div>
        <h1 contentEditable="true">${book.title}</h1>
        <h2 contentEditable="true">${book.author}</h2>
        <div class="main-item__pages">
          <span data-name="numberOfPages" contentEditable="true">${book.numberOfPages}</span> 
          <span>pages</span>
        </div>
        <div class="main-item__readstatus-container">
          <div class="main-item__readstatus ${book.readStatus ? '' : false}"></div>
        </div>
      </div>`
      this.container.prepend(bookNode);
    }

  }

  this._getBookRoot = function (node) {
    while (!node.classList.contains('main-item__container'))
      node = node.parentNode;
    return node;
  }
}

/**
  * CONTROLLER
  */
function Controller(model, view) {
  this.model = model;
  this.view = view;

  this.handleSubmit = (book) => {
    this.model.addBook(book);
  };

  this.onBookChange = (key, book) => {
    this.view.renderBook(key, book);
  };

  this.onBooksChange = (books) => {
    this.view.renderBooks(books);
  }

  this.onBooksSort = (method) => {
    this.model.sortBooks(method);
  }

  this.onBookDeleteModel = (index) => {
    this.model.deleteBook(index);
  } 

  this.onBookChangeReadStatus = (index) => {
    this.model.changeReadStatus(index);
  }

  this.onBookEdit = (key, editedBook) => {
    this.model.bookEdit(key, editedBook);
  }

  eventEmitter.on('onBooksChange', this.onBooksChange);
  eventEmitter.on('onBookChange', this.onBookChange);
  eventEmitter.on('addBook', this.handleSubmit);
  eventEmitter.on('onBookDelete',this.onBookDeleteModel);
  eventEmitter.on('onBookChangeReadStatus', this.onBookChangeReadStatus);
  eventEmitter.on('onBooksSort', this.onBooksSort);
  eventEmitter.on('onBookEdit', this.onBookEdit);

  // init on DOMload 
  this.model.addBook({ title: 'test', author: 'test', readStatus: false });
  this.model.addBook({ title: 'test1', author: 'test1', readStatus: true });
  this.model.addBook({ title: 'test', author: 'test', readStatus: false });
  this.model.addBook({ title: 'test1', author: 'test1', readStatus: true });  
}

const eventEmitter = new Event();
const app = new Controller(new Model(), new View());