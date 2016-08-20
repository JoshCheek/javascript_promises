'use strict'

const assert    = require('chai').assert;
const MyPromise = require('../promises.js')
console.log(MyPromise)

describe('MyPromise', function() {
  it('is constructed with a function, which it immediately invokes with resolution and rejection callbacks', function() {
    var resolve_cb = "not yet set";
    var reject_cb  = "not yet set";
    new MyPromise((resolve, reject) => {
      resolve_cb = resolve
      reject_cb  = reject
    })
    assert.equal(resolve_cb.constructor, Function)
    assert.equal(reject_cb.constructor,  Function)
  })

  it('invokes waiting functions when its resolution function has been called', function(testFinished) {
    var resolvedTo = "nothing yet"
    new MyPromise((resolve, reject) => resolve("the value"))
          .then(val => resolvedTo = val)
          .then(val => assert.equal(resolvedTo, "the value"))
          .then(val => testFinished())
  })

  it.skip('has a then method that will be used to add waiting functions', function() {
  })

  it.skip('passes the result of one waiting function as the value for the next waiting function', function() {
  })

  it.skip('invokes waiting functions in a breadth-first manner', function() {
  })

  describe('when the result is a promise', function() {
    it.skip('passes the promise\'s result as the next value, not the promise itself', function() {
    })
  })
  // assert.deepEqual(expected, this.rejs.getTable('testOne'))
})
