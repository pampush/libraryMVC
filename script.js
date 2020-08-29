"use strict"
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
    this.onBookChange(key, this.books.get(key)); // or formData
  }

  this.bindBookChange = function (handler) {
    this.onBookChange = handler;
  }

  this.bindBooksChange = function (handler) {
    this.onBooksChange = handler;
  }

  /* this.bindBookSort = function (handler) {
    this.onBooksSort = handler;
  } */

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
    this.onBooksChange(this.sortedBooks);  
    //return this.sortedBooks;
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

  this.bindAddBook = function (handler) {
    this.form.addEventListener('submit', e => {
      e.preventDefault();
      const book = this._fetchForm();
      this.modalBox.style = 'none';
      this.form.reset();

      handler(book);
    });
  };

  this.bindBookDelete = function (handler) {
    this.onBookDelete = handler;
  }

  this.bindBookChangeReadStatus = function (handler) {
    this.onBookChangeReadStatus = handler;
  }

  this.bindOnBooksSort = function (handler) {
    this.sortBookButtons.addEventListener('click', e => {
      if (e.target.classList.contains('active'))
        return;

      [...e.target.parentNode.children].find((node) => node.classList.contains('active')).classList.remove('active');
      e.target.classList.add('active')

      if (e.target.value == 'default')
        handler('default');
      else if (e.target.value == 'read-status')
        handler('readStatus');
    });
  }

  this.initLocalListeners = function () {
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

    this.booksContainer.addEventListener('click', e => {
      if (e.target.classList.contains('main-item__delete')) {
        this._getBookRoot(e.target).remove();
        this.onBookDelete(e.target.parentNode.dataset.index);
      }
      else if (e.target.classList.contains('main-item__readstatus')) {
        e.target.classList.toggle('false');
        this.onBookChangeReadStatus(this._getBookRoot(e.target).firstElementChild.dataset.index);
      }

    });
  };
  this.initLocalListeners();



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
        <h1>${book.title}</h1>
        <h2>${book.author}</h2>
        <div class="main-item__pages">${book.numberOfPages} pages</div>
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
        <h1>${book.title}</h1>
        <h2>${book.author}</h2>
        <div class="main-item__pages">${book.numberOfPages} pages</div>
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
    //this.render(book);
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

  this.model.bindBookChange(this.onBookChange);
  this.model.bindBooksChange(this.onBooksChange);

  this.view.bindAddBook(this.handleSubmit);
  this.view.bindBookDelete(this.onBookDeleteModel);
  this.view.bindBookChangeReadStatus(this.onBookChangeReadStatus);
  this.view.bindOnBooksSort(this.onBooksSort);

  // init on DOMload 
  this.model.addBook({ title: 'test', author: 'test', readStatus: false });
  this.model.addBook({ title: 'test1', author: 'test1', readStatus: true });
}

const app = new Controller(new Model(), new View());