'use strict'

const assert       = require('chai').assert;
const MyPromise    = require('../promises.js')
// const MyPromise    = Promise
const executeLater = function(fn) { setTimeout(fn, 0) }

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

  it('queues up waiting functions in its .then method, and invokes invokes them when its resolution function has been called', function(testFinished) {
    new MyPromise((resolve, reject) => resolve("a"))
          .then(a => assert.equal(a, "a"))
          .then(_ => testFinished())
  })

  it('passes the result of one waiting function as the value for the next waiting function', function(testFinished) {
    var seen = []
    new MyPromise((resolve, reject) => resolve("a"))
          .then(a => seen.push(a) && "b")
          .then(b => seen.push(b) && "c")
          .then(c => seen.push(c))
          .then(_ => assert.deepEqual(seen, ["a", "b", "c"]))
          .then(_ => testFinished())
  })

  it('invokes waiting functions in a breadth-first manner', function(testFinished) {
    var seen = []
    var promise = new MyPromise(resolve => resolve('a'))
    promise.then(char => seen.push(char) && 'b1')
           .then(char => seen.push(char) && 'c1')
           .then(char => seen.push(char) && 'not relevant')
    promise.then(char => seen.push(char) && 'b2')
           .then(char => seen.push(char) && 'c2')
           .then(char => seen.push(char) && 'not relevant')
           .then(_ => assert.deepEqual(seen, ['a','a', 'b1','b2', 'c1', 'c2']))
           .then(_ => testFinished())
  })

  it('works when the then functions are defined before resolve is called', function(testFinished) {
    var order = []
    var promise = new MyPromise((resolve, reject) => {
      order.push(1)
      executeLater(() => {
        order.push(3)
        resolve(5)
        order.push(4)
      })
    })
    order.push(2)
    promise.then(val => order.push(val))
           .then(_   => assert.deepEqual(order, [1, 2, 3, 4, 5]))
           .then(testFinished)
  })

  describe('when the result is a promise', function() {
    it('passes the promise\'s result as the next value, not the promise itself', function(testFinished) {
      new MyPromise((resolve, reject) => resolve('first'))
           .then(first  => new MyPromise(resolve => executeLater(()=>resolve(first+' second'))))
           .then(result => assert.equal(result, 'first second'))
           .then(testFinished)
    })
  })
  // TODO: call resolve 2x
  // TODO: Figure out wtf happens with reject
})
