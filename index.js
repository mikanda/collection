/**
 * Module dependencies.
 */

var Enumerable = require('enumerable')
  , Emitter = require('emitter')
  , bind = require('bind')
  , each = require('each');

/**
 * Module exports.
 */

module.exports = Collection;

/**
 * Initialize new collection.
 */

function Collection(models, type) {
  if (typeof models === 'function') {
    type = models;
    models = [];
  }

  /**
   * Private variables.
   */

  var self = this;
  var dirty = 0;
  models = models || [];

  /**
   * Properties.
   */

  // rescue old code
  // deprecated
  Object.defineProperty(this, '_models', {
    get: function(){
      console.log('Collection()._models is deprecated, use Collection().items');
      return this.items;
    }
  });

  // deprecated
  Object.defineProperty(this, 'items', {
    get: function(){
      return models;
    }
  });
  Object.defineProperty(this, 'dirty', {
    get: function(){
      return dirty !== 0;
    }
  });
  Object.defineProperty(this, 'length', {
    get: function(){
      return models.length;
    }
  });
  Object.defineProperty(this, 'type', {
    value: type || null,
    writable: false
  });

  /**
   * Public methods.
   */

  this.insert = insert;
  this.remove = remove;
  this.move = move;
  this.push = push;
  this.pop = pop;
  this.pin = this.resetDirty = pin;
  this.clear = clear;
  this.toJSON = toJSON;
  this.update = update;
  this.__iterate__ = iterate;

  // ensure types of models
  each(models, function(m, i){
    m = ensureType(m);
    models[i] = m;
    bind(m);
  });

  /**
   * Insert a new model at `index`.
   */

  function insert(model, index) {
    model = ensureType(model);
    _insert(model, index);
    bind(model);
    this.emit('insert', model, index);
    updateDirty(1);
    return model;
  };

  /**
   * Remove the model at `index`.
   */

  function remove(index) {
    var model = _remove(index);
    unbind(model);
    this.emit('remove', index, model);
    updateDirty(1);
    return model;
  };

  function move(from, to) {
    if (from === to) return;
    var model = _remove(from);
    _insert(model, to);
    this.emit('move', from, to);
    return model;
  };

  function push(model) {
    if (model.each) return model.each(bind(this, this.push));
    var index = models.length;
    return this.insert(model, index);
  };

  function pop() {
    var index = this.length - 1;
    return this.remove(index);
  };

  /**
   * Pin the collection to the current state.
   */

  function pin() {
    var wasDirty = dirty > 0;
    this.each(function(child){
      child.resetDirty();
    });
    dirty = 0;
    if (wasDirty) emitDirty(false, true);
  };

  /**
   * Clear the collection.
   */

  function clear() {
    models.length = 0;
    this.emit('clear');
    return this;
  };

  function toJSON() {
    var a = [];
    this.each(function(model){
      if (typeof model.toJSON == 'function') model = model.toJSON();
      a.push(model);
    });
    return a;
  };

  function update(collection) {

    /**
     * Remove old models from collection.
     */

    var remove = [];
    this.each(function(model, index){
      if (model == null) return;
      if (!~collection.indexOf(model)) {
        remove.push({
          index: index,
          model: model
        });
      }
    });

    for (var i = remove.length-1; i >= 0; --i) {
      this.remove(remove[i].index);
    }

    /**
     * Insert new models, if not already in.
     */

    collection.each(function(model, index){
      var old = self.indexOf(model);
      if (!~old) self.push(model);
    });

    /**
     * Sort collection as the new col.
     */

    collection.each(function(model, index){
      var old = self.indexOf(model);
      self.move(old, index);
    });
  };

  /**
   * Satisfy iteration API.
   */

  function iterate() {
    return {
      length: function(){ return models.length; },
      get: function(i){ return models[i]; }
    };
  };

  function _insert(model, index) {
    models.splice(index, 0, model);
  }

  function _remove(index) {
    var model = models.splice(index, 1)[0];
    return model;
  }

  function handleDestroy() {
    var index = models.indexOf(this);
    self.remove(index);
  };

  /**
   * Is bound as event handler to the destroying of a model.
   */

  function handleChange(name, value) {
    if (name == 'dirty') {
      if (value == true) return self._dirty(1);
      if (value == false) return self._dirty(-1);
    }
    var args = [].slice.call(arguments, 1);
    var index = self._models.indexOf(this);
    name = 'items.' + index + '.' + name;
    args.unshift(name);
    args.unshift('change');
    self.emit.apply(self, args);
  };

  function updateDirty(v) {
    dirty += v;
    if (dirty === 1 && v === 1) return emitDirty(true, false);
    if (dirty == 0) return emitDirty(false, true);
  }

  function emitDirty(value, old) {
    self.emit('change', 'dirty', value, old);
    self.emit('change dirty', value, old);
  }

  /**
   * Bind the events of a newly inserted model.
   */

  function bind(model) {
    var self = this;
    model.on('destroy', handleDestroy);
    model.on('change', handleChange);
  }

  function unbind(model) {
    model.off('destroy', handleDestroy);
    model.off('change', handleChange);
  }

  function ensureType(model) {
    var type = self.type;
    if (typeof type !== 'function') return model;
    if (!(model instanceof type)) {
      return new type(model);
    }
    return model;
  }
}

/**
 * Creates a constructor which encloses `type`.
 */

Collection.type = function(type){
  return function(models){
    return new Collection(models, type);
  };
};

// emitter mixin
Emitter(Collection.prototype);

// enumerable mixin
Enumerable(Collection.prototype);
