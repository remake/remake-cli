var store = {
  state: {
    newItemRenderFunctions: {}
  },
  addNewItemRenderFunction({name, func} = {}) {
    if (name && func) {
      this.state.newItemRenderFunctions[name] = func;
    }
  },
  getNewItemRenderFunction({name}) {
    if (name && this.state.newItemRenderFunctions[name]) {
      return this.state.newItemRenderFunctions[name];
    }
  }
};

export default store;