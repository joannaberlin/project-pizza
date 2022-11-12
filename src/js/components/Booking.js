import { templates, select, settings, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import {utils} from '../utils.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.element = element;
    thisBooking.tableData = null;

    thisBooking.render();
    thisBooking.initWidgets();
    thisBooking.initActions();
    thisBooking.getData();
    thisBooking.initBookingForm();
  }

  getData() {
    const thisBooking = this;

    const params = {
      eventsCurrent: [
        settings.db.notRepeatParam
      ],
      eventsRepeat: [
        settings.db.repeatParam
      ],
    };

    // console.log('getData params', params);

    const urls = {
      bookings:      settings.db.url + '/' + settings.db.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event
                                     + '?' + params.eventsRepeat.join('&'),
    };

    // console.log('getData urls', urls);

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerWidget.minDate;
    const maxDate = thisBooking.datePickerWidget.maxDate;

    for(let item of eventsRepeat) {
      if(item.repeat == 'daily') {
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }

      }
    }

    // console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  initBookingForm() {
    const thisBooking = this;

    thisBooking.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();

      thisBooking.sendBooking();
    });
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
        if (table.classList.contains(classNames.booking.tableSelected)) {
          table.classList.remove(classNames.booking.tableSelected);
          thisBooking.tableData = null;
        }
      }
    }

  }

  initTables() {
    const thisBooking = this;

    const tableBooked = thisBooking.pickedTable.classList.contains(classNames.booking.tableBooked);
    const tableWithClassSelected = thisBooking.pickedTable.classList.contains(classNames.booking.tableSelected);
    const numberOfPickedTable = thisBooking.pickedTable.getAttribute(select.booking.tableNumber);


    for (let table of thisBooking.dom.tables) {
      if (tableBooked) {
        alert('Table unavailable! Please check another date or hour.');
        break;
      } else if (tableWithClassSelected) {
        thisBooking.pickedTable.classList.remove(classNames.booking.tableSelected);
        thisBooking.tableData = null;
        break;
      }
      table.classList.toggle(classNames.booking.tableSelected, table == thisBooking.pickedTable);
      thisBooking.tableData = numberOfPickedTable;
    }
  }

  render() {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};

    thisBooking.dom.wrapper = thisBooking.element;

    thisBooking.element.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.allTables = thisBooking.dom.wrapper.querySelector(select.containerOf.tables);
    thisBooking.dom.bookBtn = thisBooking.dom.wrapper.querySelector(select.booking.bookBtn);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.hoursAmountInput = thisBooking.dom.wrapper.querySelector(select.booking.hoursInput);
    thisBooking.dom.peopleAmountInput = thisBooking.dom.wrapper.querySelector(select.booking.peopleInput);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starter);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.amountWidgetPeople = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.amountWidgetHours = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);
  }

  initActions() {
    const thisBooking = this;

    thisBooking.dom.allTables.addEventListener('click', function(event) {
      const element = event.target;

      if (element.classList.contains(classNames.booking.table)) {
        thisBooking.pickedTable = element;
        thisBooking.initTables();
      }
    });

    thisBooking.dom.peopleAmount.addEventListener('updated', function() {
    });
    thisBooking.dom.hoursAmount.addEventListener('updated', function() {
    });

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
  }

  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePickerWidget.correctValue,
      hour: thisBooking.hourPickerWidget.correctValue,
      table: parseInt(thisBooking.tableData),
      duration: parseInt(thisBooking.dom.hoursAmountInput.value),
      ppl: parseInt(thisBooking.dom.peopleAmountInput.value),
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value
    };

    for (const radioBtn of thisBooking.dom.starters) {
      if (radioBtn.checked) {
        payload.starters.push(radioBtn.value);
      }
    }
    console.log(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse:', parsedResponse);
        thisBooking.makeBooked(parsedResponse.date, parsedResponse.hour, parsedResponse.duration, parsedResponse.table);
        thisBooking.pickedTable.classList.remove(classNames.booking.tableSelected);
        thisBooking.updateDOM();
        console.log(thisBooking.booked);
      });

  }
}

export default Booking;