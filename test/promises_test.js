'use strict'

const assert    = require('chai').assert;
const MyPromise = require('../promises.js')
console.log(MyPromise)

describe('MyPromise', function() {
  it('is constructed with a function that it invokes immediately', function() {
    var value = "unchanged"
    new MyPromise((resolve, reject) => value = "changed")
    assert.equal("changed", value)
  })

  it('gives the function a function for resolution and rejection')
  it('invokes waiting functions when its resolution function has been called')
  it('has a then method that will be used to add waiting functions')
  it('passes the result of one waiting function as the value for the next waiting function')
  it('invokes waiting functions in a breadth-first manner')
  describe('when the result is a promise', function() {
    it('passes the promise\'s result as the next value, not the promise itself')
  })
  // assert.deepEqual(expected, this.rejs.getTable('testOne'))
})
