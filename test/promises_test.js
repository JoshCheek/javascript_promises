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

  it('ignores resolutions after the first one', function(testFinished) {
    var seen    = []
    new MyPromise((resolve, reject) => {
      resolve('a')
      resolve('b')
    }).then(a => seen.push(a))
      .then(_ => assert.deepEqual(seen, ['a']))
      .then(_ => testFinished())
  })

  describe('when the result is a promise', function() {
    specify('.then passes the promise\'s result as the next value, not the promise itself', function(testFinished) {
      new MyPromise((resolve, reject) => resolve('first'))
           .then(first  => new MyPromise(resolve => executeLater(()=>resolve(first+' second'))))
           .then(result => assert.equal(result, 'first second'))
           .then(testFinished)
    })
    specify('.catch passes the promise\'s result as the next value, not the promise itself', function(testFinished) {
      new MyPromise((resolve, reject) => reject('first'))
           .catch(first => new MyPromise(resolve => executeLater(()=>resolve(first+' second'))))
           .then(result => assert.equal(result, 'first second'))
           .then(testFinished)
    })
  })

  describe('when there is an exception in the constructor', function() {
    it('passes the result to each dependent fn chain, which can catch the result', function(testFinished) {
      var seen = []
      var promise = new MyPromise((result, reject) => { throw("errr") })
      promise.catch(err => { seen.push(err); return 1 })
             .then(val  => { seen.push(val); return 2 })
             .then(val  => { seen.push(val); return 3 })
      promise.then(val  => { seen.push(val); return 4 })
             .catch(err => { seen.push(err); return 5 })
             .then(val  => { seen.push(val); return 6 })
      promise.catch(err => { seen.push(err); return 7 })
             .then(val  => { seen.push(val); return 8 })
             .then(val  => { seen.push(val); return 9 })
             .then(_    => assert.deepEqual(seen, ['errr', 'errr', 1, 'errr', 7, 2, 5, 8]))
             .then(testFinished)
    })
  })

  specify('invoking reject in the constructor puts it into an errored state, similar to raising an error', function(testFinished) {
    var seen = []
    var promise = new MyPromise((result, reject) => { reject("errr") })
    promise.catch(err => { seen.push(err); return 1 })
           .then(val  => { seen.push(val); return 2 })
           .then(val  => { seen.push(val); return 3 })
    promise.then(val  => { seen.push(val); return 4 })
           .catch(err => { seen.push(err); return 5 })
           .then(val  => { seen.push(val); return 6 })
    promise.catch(err => { seen.push(err); return 7 })
           .then(val  => { seen.push(val); return 8 })
           .then(val  => { seen.push(val); return 9 })
           .then(_    => assert.deepEqual(seen, ['errr', 'errr', 1, 'errr', 7, 2, 5, 8]))
           .then(testFinished)
  })

  specify('invoking reject does not halt execution', function(testFinished) {
    var seen = []
    new MyPromise((result, reject) => {
      seen.push(1)
      reject('uhh')
      seen.push(2)
    }).catch(_ => assert.deepEqual(seen, [1, 2]))
      .then(testFinished)
  })

  it('ignores rejections after the first one', function(testFinished) {
    var seen = []
    new MyPromise((resolve, reject) => {
      reject('a')
      reject('b')
    }).catch(a => seen.push(a))
      .then(_ => assert.deepEqual(seen, ['a']))
      .then(_ => testFinished())
  })

  specify('wen the result is null/undefined, it behaves the same as if it were a value', function(testFinished) {
    var seen = []
    new MyPromise((result, reject) => result(null))
          .then(val => seen.push(val) && undefined)
          .then(val => seen.push(val))
    new MyPromise((result, reject) => result(undefined))
          .then(val => seen.push(val) && null)
          .then(val => seen.push(val))
          .then(_   => assert.deepEqual(seen, [null, undefined, undefined, null]))
          .then(testFinished)
  })

  specify('when we throw null/undefined, it behaves the same as when we throw any other value', function(testFinished) {
    var seen = []
    new MyPromise((result, reject) => reject(null))
          .catch(val => seen.push(val))
    new MyPromise((result, reject) => reject(undefined))
          .catch(val => seen.push(val))
          .then(_    => assert.deepEqual(seen, [null, undefined]))
          .then(testFinished)
  })

  specify('.then, declared from within a .then will be appended to the event queue', function(testFinished) {
    var seen = []
    var promise = new MyPromise((result, reject) => result('a'))
    promise.then(val => {
             seen.push([1, val])
             promise.then(val => {
               seen.push([3, val])
               promise.then(val => seen.push([5, val]))
             })
             seen.push([2, val])
             return 'b'
           })
           .then(val => seen.push([4, val]))
           .then(_   => assert.deepEqual(seen, [
             [1, 'a'], [2, 'a'], [3, 'a'], [4, 'b'], [5, 'a']
           ]))
           .then(testFinished)
  })

  describe('when a .then / .catch block throws ane error', function() {
    it('progresses as if reject had been called', function(testFinished) {
      var errs = []
      new MyPromise((result, reject) => result(1))
            .then(_ => { throw('a') })
            .then(_ => errs.push("will not execute"))
            .catch(err => {
              errs.push(err)
              throw('b')
            })
            .then(_ => errs.push("will not execute"))
            .catch(err => errs.push(err))
            .then(_ => assert.deepEqual(errs, ['a', 'b']))
            .then(testFinished)
    })
  })

  describe('when both reject and result are called (in whichever order)', function() {
    specify('when the result is invoked first, it ignores the reject', function(testFinished) {
      var seen = []
      var promise = new MyPromise((result, reject) => {
        result('a')
        reject('b')
      })
      promise.then(val  => seen.push(val))
             .catch(val => seen.push(val))
      promise.catch(val => seen.push(val))
             .then(val  => seen.push(val))
             .then(_ => assert.deepEqual(seen, ['a', 'a']))
             .then(testFinished)

    })

    specify('when the reject is invoked first, it ignores the result', function(testFinished) {
      var seen = []
      var promise = new MyPromise((result, reject) => {
        reject('b')
        result('a')
      })
      promise.then(val  => seen.push(val))
             .catch(val => seen.push(val))
      promise.catch(val => seen.push(val))
             .then(_ => assert.deepEqual(seen, ['b', 'b']))
             .then(testFinished)
    })
  })

  specify('ignores .catch callbacks, when there is no error', function(testFinished) {
    var seen = []
    new MyPromise((result, reject) => result('a'))
          .then(val  => seen.push([1, val]) && 'b')
          .catch(val => seen.push([2, val]) && 'c')
          .then(val  => seen.push([3, val]))
          .then(_    => assert.deepEqual(seen, [
            [1, 'a'], [3, 'b']
          ]))
          .then(testFinished)
  })

  // TODO: Apparently you can pass 2 args to .then (maybe also to .catch?)

  describe('.length', function() {
    it('is always 1 (number of constructor arguments)', function() {
      assert.equal(MyPromise.length, 1)
    })
  })

  describe('.reject', function() {
    it('returns a Promise object that is rejected with the given reason', function(testFinished) {
      var seen = []
      MyPromise.reject("because reasons")
               .then(reason  => seen.push([1, reason]))
               .catch(reason => seen.push([2, reason]))
      MyPromise.reject(new Error("o.O"))
               .then(err     => seen.push([3, err.message]))
               .catch(err    => seen.push([4, err.message]))
               .then(_       => assert.deepEqual(seen, [[2, "because reasons"], [4, 'o.O']]))
               .then(testFinished)

    })
  })

  describe('.resolve', function() {
    it('returns a promise that is resolved with the given value', function(testFinished) {
      var p1 = MyPromise.resolve('abc')
      var p2 = MyPromise.resolve(null)
      var p3 = MyPromise.resolve(undefined)
      p1.then(val => assert.equal(val, 'abc'))
      p2.then(val => assert.equal(val, null))
      p3.then(val => assert.equal(val, undefined))
        .then(testFinished)
    })

    it('if the value is a thenable, the returned promise will adopt its eventual state', function(testFinished) {
      MyPromise.resolve({then: (cb) => cb('hello')})
               .then(val => assert.equal(val, 'hello'))
               .then(testFinished)
    })

    it('resolves errored promises as well', function(testFinished) {
      var seen = []
      MyPromise.resolve(
        new MyPromise((resolve, reject) => reject("err"))
      ).then(val  => seen.push([1, val]))
       .catch(err => seen.push([2, err]))
       .then(_    => assert.deepEqual(seen, [[2, 'err']]))
       .then(testFinished)
    })
  })

  describe('.all', function() {
    it('waits for all fulfillments', function(testFinished) {
      // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
      var p1 = MyPromise.resolve(3)
      var p2 = 'three'
      var p3 = new MyPromise((resolve, reject) => setTimeout(resolve, 10, "foo"))
      MyPromise.all([p1, p2, p3])
               .then(values => assert.deepEqual(values, [3, 'three', "foo"]))
               .then(testFinished)
    })

    it('organizes the results by their order in the array, not order of completion', function(testFinished) {
      var p1 = new MyPromise((resolve, reject) => setTimeout(resolve,  0, "one"  ))
      var p2 = new MyPromise((resolve, reject) => setTimeout(resolve, 10, "two"  ))
      var p3 = new MyPromise((resolve, reject) => setTimeout(resolve,  5, "three"))

      MyPromise.all([p1, p2, p3])
               .then(values => assert.deepEqual(values, ["one", "two", "three"]))
               .then(testFinished)
    })

    it('abandons waiting upon the first rejection', function(testFinished) {
      // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
      var p1finished = false
      var p1 = new MyPromise((resolve, reject) => setTimeout(function() {
        p1finished = true
        resolve("one")
      }, 1000))
      var p2 = new MyPromise((resolve, reject) => setTimeout(resolve, 25, "two"  ))
      var p3 = new MyPromise((resolve, reject) => setTimeout(resolve, 20, "three"))
      var p4 = new MyPromise((resolve, reject) => reject("nahhh"))
      var p5 = new MyPromise((resolve, reject) => setTimeout(resolve, 15, "four" ))

      var seen = []
      MyPromise.all([p1, p2, p3, p4, p5])
               .then(val  => seen.push(val))
               .catch(err => seen.push(err))
               .then(_    => assert.equal(p1finished, false))
               .then(_    => assert.deepEqual(seen, ['nahhh']))
               .then(testFinished)
    })

    it('yields an empty array when no fulfillments were passed', function(testFinished) {
      MyPromise.all([])
               .then(vals => assert.deepEqual(vals, []))
               .then(testFinished)
    })

    it('explodes into the catch block when given no arguments (for whatever fkn reason -.^)', function(testFinished) {
      Promise.all().catch(err => testFinished())
    })
  })
})
