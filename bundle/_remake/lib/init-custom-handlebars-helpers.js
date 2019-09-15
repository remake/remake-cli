import RemakeStore from "./remake-store";

export function initCustomHandlebarsHelpers ({Handlebars}) {

  // forEachItem 
  // a custom helper that loops over some items
  //
  // IMPORTANT: 
  // if you pass in a named param called `itemName`, you can refer to its 
  // name later in a data-i-new attribute in order to render a new item on 
  // the page
  Handlebars.registerHelper('forEachItem', function(context, options) {
    RemakeStore.addNewItemRenderFunction({
      name: options.hash.itemName, 
      func: options.fn
    });

    if (!context) {
      return "";
    }

    // contextItem has the data passed into the helper
    let overallRender = context.map(contextItem => {
      
      // move the context item inside the provided name
      let data = {};
      if (options.hash.itemName) {
        data[options.hash.itemName] = contextItem;
      }

      // render the inner template
      let renderedItem = options.fn(data);

      return renderedItem;
    }).join("");
    
    return overallRender;
  });

  Handlebars.registerHelper('BaseRoute', function(options) {
    if (!this.params.id && !this.params.username) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  Handlebars.registerHelper('UsernameRoute', function(options) {
    if (this.params.username) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  Handlebars.registerHelper('ItemRoute', function(options) {
    if (this.params.id) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

}



