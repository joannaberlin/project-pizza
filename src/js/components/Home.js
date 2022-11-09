import { templates } from '../settings.js';

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.element = element;
    console.log(thisHome.element);

    thisHome.render();
  }

  render() {
    const thisHome = this;

    const generatedHTML = templates.homePage();

    thisHome.dom = {};

    thisHome.dom.wrapper = thisHome.element;

    thisHome.element.innerHTML = generatedHTML;
  }
}

export default Home;