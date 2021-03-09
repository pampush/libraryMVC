  "use strict"
  /**
   * so that's all is not MVC but pubsub/observer pattern implementation?? ._.
   */

  /**
    * TODO: seperate code into appropriate files
    */
  
  /**
   * dumb observer/pubsub ??? implemetation 
   */
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

  /**
   * MODEL
   */
  function Model() {
    // this.books = new Map();
    // this.sortedBooks = new Map();

    // this.sort = { // take note that value object in maps are equal (sortedBooks refers to books); 
    //   default: () => new Map([...this.books]),
    //   readStatus: () => new Map([...this.books].sort((a, b) => a[1].readStatus - b[1].readStatus)),
    // }

    this.addBook = function (formData) {
      const key = Date.now() + Math.floor(Math.random() * 100); // FIXME: change randomizer 
      formData.key = key;
      //this.books.set(key, formData);
    }

    // this.deleteBook = function (index) {
    //   index = this._toNumber(index);
    //   this.books.delete(index);
    // }

    // this.changeReadStatus = function (index) {
    //   index = this._toNumber(index);
    //   const book = this.books.get(index);
    //   book.readStatus = !book.readStatus;
    // }

    // this.sortBooks = function (method) {
    //   this.sortedBooks.clear(); // prevent memory leak
    //   this.sortedBooks = this.sort[method](); // false ahead
      
    //   //eventEmitter.emit('onBooksChange', this.sortedBooks);
    // }

    // this.bookEdit = function (index, obj) {
    //   index = this._toNumber(index);
    //   for(const prop in obj)
    //     this.books.get(index)[prop] = obj[prop];
    // }

    // this._toNumber = function (value) {
    //   if (typeof (value) != 'number')
    //     return +value;
    // }
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
    this.loadBooksButton = document.querySelector('button[value="loadBooks"]');

    this.resetForm = function (elem) {
      this.modalBox.style = 'none';
      this.form.reset();
    }
    // this.booksContainer.addEventListener('focusout', (e) => {
    //     eventEmitter.emit('onBookEdit', this._getBookRoot(e.target).dataset.index, this._temporaryProperty);
    // });

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

      // this.booksContainer.addEventListener('input', (e) => {
      //   this._temporaryProperty = {[e.target.dataset.name]: e.target.textContent}; 
      // }); 
    };

    this._initLocalListeners();

    this.onBookDelete = function(e) {
      this._getBookRoot(e).parentElement.remove();
    }

    this._fetchForm = function () {
      const book = {};
      for (const field of this.form.elements) {
        if (field.type == 'text')
          book[field.name] = field.value;
        if (field.type == 'checkbox') {
          if (field.checked)
            book.readstatus = true;
          else
            book.readstatus = false;
        }
      }
      return book;
    }

    this._fetchBook = function (elem) {
      const bookRoot = this._getBookRoot(elem);
      return {
        key: bookRoot.dataset.index,
        title: bookRoot.querySelector('h1').textContent,
        author: bookRoot.querySelector('h2').textContent,
        readstatus: bookRoot.querySelector('.main-item__readstatus').classList.contains('false') ? false : true,
        pages: bookRoot.querySelector('.main-item__pages span').textContent
      }
    } 

    this.renderBook = function (book) {
      const bookNode = document.createElement('div');
      bookNode.classList.add('main-item__container');
      bookNode.innerHTML = `<div class="main-item" data-index="${book.key}">
        <div class="main-item__delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ff0028" viewBox="0 0 24 24">
            <path class="st0" d="M0,0h24v24H0V0z" fill="none"></path>
            <path d="M12,0C5.4,0,0,5.4,0,12s5.4,12,12,12s12-5.4,12-12S18.6,0,12,0z M17,13H7v-2h10V13z"></path>
          </svg>
          </div>
          <h1 data-name="title" contentEditable="true">${book.title}</h1>
          <h2 data-name="author" contentEditable="true">${book.author}</h2>
          <div class="main-item__pages">
            <span data-name="numberOfPages" contentEditable="true">${book.pages}</span> 
            <span>pages</span>
          </div>
          <div class="main-item__readstatus-container">
            <div class="main-item__readstatus ${book.readstatus ? '' : false}"></div>
          </div>
      </div>`
      this.container.prepend(bookNode);
    }

    this.renderBooks = function (books) {
      while (this.booksContainer.firstChild) {
        this.booksContainer.removeChild(this.booksContainer.firstChild)
      }

      for(let [key, book] of books) {
        this.renderBook(book);
      };
    }

    this.renderBooksFromDb = function (snap) {
      for(let [key, value] of Object.entries(snap)) {
        this.renderBook(value);
      }
    }

    this.changeReadStatus = (elem) => elem.classList.toggle('false');

    this._getBookRoot = function (node) {
      while (!node.classList.contains('main-item'))
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

    this.onBookChange = (book) => {
      this.view.renderBook(book);
    };

    this.onBooksChange = (books) => {
      this.view.renderBooks(books);
    }

    this.onBooksSort = (method) => {
      this.model.sortBooks(method);
      this.view.renderBooks(model.sortedBooks);
    }

    this.onBookDeleteModel = (index) => {
      this.model.deleteBook(index);
    } 

    this.onBookChangeReadStatus = (index) => {
      this.model.changeReadStatus(index);
    }

    // this.onBookEdit = (key, editedBook) => {
    //   this.model.bookEdit(key, editedBook);
    // }

    // TODO: MOVE ALL DB FUNCS IN MODEL object

    const firebaseConfig = {
      apiKey: "AIzaSyDcNQbxeQw5cxqq1N_L08AO3ZSimHgJ7CU",
      authDomain: "library-a79ce.firebaseapp.com",
      databaseURL: "https://library-a79ce-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "library-a79ce",
      storageBucket: "library-a79ce.appspot.com",
      messagingSenderId: "274413151617",
      appId: "1:274413151617:web:3ede87e19884f888453480",
      measurementId: "G-Q8L338M7WV"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    //firebase.analytics();

    const dbRef = firebase.database().ref().child('books');

    function dbUpdate(book) {
      firebase.database().ref('books/' + book.key).set({
        key: book.key,
        title: book.title,
        author: book.author,
        readstatus: book.readstatus,
        pages: book.pages,
      });
    }
    
    function dbDeleteItem(id) {
      console.log(id);
      dbRef.child(id).remove()
    }
    
    function dbUpdateBook(book) {
      firebase.database().ref('books/' + book.key).update({
        key: book.key,
        title: book.title,
        author: book.author,
        readstatus: book.readstatus,
        pages: book.pages,
      });
    }
    
    function dbLoadBooks(viewRenderMethod) {
      dbRef.get().then(snap => viewRenderMethod(snap.val()))
    }

    view.form.addEventListener('submit', e => {
      e.preventDefault();
      eventEmitter.emit('addBook', view._fetchForm());
    });

    
    view.booksContainer.addEventListener('click', e => {
      if (e.target.classList.contains('main-item__delete')) 
        eventEmitter.emit('onBookDelete', e.target);
      if (e.target.classList.contains('main-item__readstatus'))
        eventEmitter.emit('onBookChangeReadStatus', e.target);
    });

    document.addEventListener('DOMContentLoaded', () => {
      eventEmitter.emit('pageLoaded', (book) => view.renderBooksFromDb(book)); // callback
    }, {once:true})

    //eventEmitter.on('onBooksChange', this.onBooksChange);
    //eventEmitter.on('onBookChange', this.onBookChange);
    eventEmitter.on('pageLoaded', dbLoadBooks);

    eventEmitter.on('addBook', () => view.resetForm())
    eventEmitter.on('addBook', this.handleSubmit);
    eventEmitter.on('addBook', this.onBookChange);
    eventEmitter.on('addBook', dbUpdate);

    eventEmitter.on('onBookDelete', (e) => view.onBookDelete(e));
    //eventEmitter.on('onBookDelete', this.onBookDeleteModel);
    eventEmitter.on('onBookDelete', (e) => dbDeleteItem(e.parentNode.dataset.index));

    //eventEmitter.on('onBookChangeTitle', view.changeTitle);
    //eventEmitter.on('onBookChangeTitle', (book) => dbUpdateBook(book));
    //etc.

    eventEmitter.on('onBookChangeReadStatus', view.changeReadStatus);
    eventEmitter.on('onBookChangeReadStatus', (elem) => dbUpdateBook(view._fetchBook(elem)));

    eventEmitter.on('onBooksSort', this.onBooksSort);
    
    //eventEmitter.on('onBookEdit', this.onBookEdit);
  }

  const eventEmitter = new Event();
  const app = new Controller(new Model(), new View());