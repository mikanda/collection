
/**
 * Module dependencies.
 */

var chai = require('chai')
  , model = require('model')
  , Collection = require('collection')
  , expect = chai.expect;

var User = model()
  .attr('name');

describe('Collection', function(){
  describe('constructor', function(){
    it('should wrap all models', function(done){
      var collection = new Collection();
      expect(collection.length).to.equal(0);
      expect(collection.items).to.eql([]);
      expect(collection.type).to.equal(null);
      done();
    });
    it('should handle types properly', function(done){
      var user = new User({ name: 'Hans' });
      var collection = new Collection([ user ]);
      expect(collection.length).to.equal(1);
      expect(collection.items).to.eql([ user ]);
      expect(collection.at(0)).to.equal(user);
      collection = new Collection([ { name: 'Test' } ], User);
      expect(collection.length).to.equal(1);
      expect(collection.at(0).name).to.equal('Test');
      expect(collection.at(0) instanceof User).to.be.true;
      done();
    });
  });
  describe('.insert()', function(){

    // TODO: test for event emission ('insert')
    it('should insert a new element at the beginning', function(done){
      var user = new User({ name: 'First user' });
      var secondUser = new User({ name: 'Second user' });
      var collection = new Collection([ user ]);
      collection.insert(secondUser, 0);
      expect(collection.items).to.eql([ secondUser, user ]);
      expect(collection.at(0)).to.equal(secondUser);
      expect(collection.at(1)).to.equal(user);
      expect(collection.dirty).to.be.true;
      done();
    });
    it('should insert a new element with given type', function(done){
      var UserCollection = Collection.type(User);
      var collection = new UserCollection();
      collection.insert({ name: 'Testuser' });
      expect(collection.at(0).name).to.equal('Testuser');
      expect(collection.at(0) instanceof User).to.be.true;
      expect(collection.dirty).to.be.true;
      done();
    });
  });
  describe('.remove()', function(){

    // TODO: test for event emission ('remove')
    it('should remove an element at a specific index', function(){
      var collection = new Collection(User);
      var user = new User({ name: 'First user' });
      var secondUser = new User({ name: 'Second user' });
      collection.insert(secondUser);
      collection.insert(user);
      expect(collection.at(0)).to.equal(user);
      expect(collection.at(1)).to.equal(secondUser);
      collection.remove(1);
      expect(collection.at(0)).to.equal(user);
    });
  });
  describe('.move()', function(){
    it('should move on element from one index to another', function(){
      var users = [
        new User({ name: 'First user' }),
        new User({ name: 'Second user' }),
        new User({ name: 'Third user' }),
        new User({ name: 'Fourth user' })
      ];
      var collection = new Collection([
        users[0], users[1], users[2], users[3]
      ]);
      collection.move(0, 2);
      expect(collection.at(0)).to.equal(users[1]);
      expect(collection.at(1)).to.equal(users[2]);
      expect(collection.at(2)).to.equal(users[0]);
      collection.move(2, 0);
      expect(collection.at(0)).to.equal(users[0]);
      expect(collection.at(1)).to.equal(users[1]);
      expect(collection.at(2)).to.equal(users[2]);
    });
  });
  describe('.push()', function(){
    it('should push a new model', function(){
      var collection = new Collection([ { name: 'First user' } ], User);
      var user = new User({ name: 'Second user' });
      collection.push(user);
      expect(collection.at(1)).to.equal(user);
    });
  });
  describe('.pop()', function(){
    it('should pop the last model', function(){
      var users = [
        new User({ name: 'First user' }), new User({ name: 'Second user' })
      ];
      var collection = new Collection(users);
      collection.pop();
      expect(collection.length).to.equal(1);
      expect(collection.at(0)).to.equal(users[0]);
      expect(collection.dirty).to.be.true;
    });
  });
  describe('.pin()', function(){
    it('should pin the collection to the current state', function(){
      var collection = new Collection();
      expect(collection.dirty).to.equal(false);
      collection.push(new User({ name: 'First user' }));
      expect(collection.dirty).to.equal(true);
      collection.pin();
      expect(collection.dirty).to.equal(false);
    });
  });
  describe('.clear()', function(){

    // TODO: test for event emission
    it('should clear the collection', function(){
      var collection = new Collection([ new User(), new User() ]);
      expect(collection.length).to.equal(2);
      collection.clear();
      expect(collection.length).to.equal(0);
      expect(collection.items).to.eql([]);
    });
  });
  describe('.toJSON()', function(){
    it('should serialize the collection', function(){
      var user = new User({ name: 'Test' });
      var collection = new Collection([ user, user ]);
      expect(collection.toJSON()).to.eql([ user.toJSON(), user.toJSON() ]);
    });
  });
  describe('.reset()', function(){
    it('should reset the collection', function(){
      var collection = new Collection([
        new User({ name: 'initial 1' }),
        new User({ name: 'initial 2' })
      ]);
      collection.push(new User({ name: 'new 1' }));
      collection.push(new User({ name: 'new 2' }));
      collection.move(2, 3);
      collection.move(1, 2);
      collection.remove(0);
      console.log(collection.toJSON());
      collection.reset();
      expect(collection.toJSON()).to.eql([ { name: 'initial 1' }, { name: 'initial 2' } ]);
    });
  });
  describe('manual resetting', function(){
    it('should reset the dirty state after an resetting push', function(){
      var user = new User({ name: 'Test user' });
      var collection = new Collection([ user ]);
      collection.pop();
      expect(collection.dirty).to.be.true;
      collection.push(user);
      expect(collection.dirty).to.be.false;
    });
  });
});
