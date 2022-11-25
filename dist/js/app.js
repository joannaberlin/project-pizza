import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';
import Home from './components/Home.js';

const app = {
  initPages: function() {
    const thisApp = this;

    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    thisApp.mainInfoLinks = document.querySelectorAll(select.homepage.infoLinks);
    thisApp.pages = document.querySelector(select.containerOf.pages).children;

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages) {
      if (page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);

    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function(event) {
        const clickedElement = this;
        event.preventDefault();

        thisApp.directToPage(clickedElement);
      });
    }

    for (let link of thisApp.mainInfoLinks) {
      link.addEventListener('click', function(event) {
        const clickedElement = this;
        event.preventDefault();

        thisApp.directToPage(clickedElement);
      });
    }
  },

  directToPage: function(element) {
    const thisApp = this;

    const clickedElement = element;

    /* get page id from href attribute */
    const id = clickedElement.getAttribute('href').replace('#', '');

    /* run thisApp.activatePage with that id */
    thisApp.activatePage(id);

    /* change URL hash */
    window.location.hash = '#/' + id;
  },

  activatePage: function(pageId) {
    const thisApp = this;

    //add class "active" to matching pages, remove from non-matching
    for (let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    //add class "active" to matching links, remove from non-matching
    for (let link of thisApp.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },

  initMenu: function() {
    const thisApp = this;

    for (let productData in thisApp.data.products) {
      new Product (thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function() {
    const thisApp = this;

    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.products;

    fetch(url)
      .then(function(rawResponse) {
        return rawResponse.json();
      })
      .then(function(parsedResponse) {
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });
  },

  init: function () {
    const thisApp = this;
    // console.log('*** App starting ***');
    // console.log('thisApp:', thisApp);
    // console.log('classNames:', classNames);
    // console.log('settings:', settings);
    // console.log('templates:', templates);
    thisApp.initHome();
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
  },

  initCart: function() {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(event) {
      app.cart.add(event.detail.product.prepareCartProduct());
    });
  },

  initBooking: function() {
    const thisApp = this;

    const bookingContainer = document.querySelector(select.containerOf.booking);

    thisApp.booking = new Booking(bookingContainer);
  },

  initHome: function() {
    const thisApp = this;

    const homeContainer = document.querySelector(select.containerOf.home);

    thisApp.home = new Home(homeContainer);
  }
};

app.init();



