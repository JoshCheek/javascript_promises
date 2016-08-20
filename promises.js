module.exports = MyPromise

function MyPromise(fn) {
  this._thenClauses = [];
  const resolve = (val) => {
    this._resolvedTo = val
    this._thenClauses.forEach(fn => fn(val))
  }
  const reject  = (idk) => console.log("Uhhhh, this is a mistake >.<")
  fn(resolve, reject)
}

MyPromise.prototype.then = function(fn) {
  var promise = new MyPromise((resolve, reject) => {
      var invoke = (val) => {
        setTimeout(() => {
          var result = fn(val)
          if(result && result.constructor === MyPromise)
            result.then(val => resolve(val))
          else
            resolve(result)
        }, 0)
    }
    if(this._resolvedTo !== undefined)
      invoke(this._resolvedTo)
    else
      this._thenClauses.push(invoke)
  })
  return promise
}

// const PromiseClass = Promise
// var t1 = 10
// // output: 10, 20, 40
// new PromiseClass((resolve, reject) => setTimeout(() => resolve(10), t1))
//       .then(num => log2('first then: ',  num, num*2))
//       .then(num => log2('second then: ', num, num*2))
//       .then(num => log2('last then: ',   num, num*2))
//       .then(_   => log2('---------------'))
//       .then(function() {
//         // output: 2nd is 1 second after first
//         new PromiseClass((resolve, reject) => setTimeout(() => resolve('first'), t1+1))
//               .then(val => log2('time 1: ', new Date(), "a"))
//               .then(val => new PromiseClass(resolve => setTimeout(()=>resolve('second'), 1000)))
//               .then(val => log2('time 2: ', new Date(), "b"))
//               .then(() => {
//                 // output: a,a, b1,b2, c1,c2
//                 var promise = new PromiseClass(resolve => resolve('a'))
//                 promise.then(char => log1(char, 'b1'))
//                        .then(char => log1(char, 'c1'))
//                        .then(char => log1(char, 'd1'))
//                 promise.then(char => log1(char, 'b2'))
//                        .then(char => log1(char, 'c2'))
//                        .then(char => log1(char, 'd2'))
//               })
//       })


// function log1(val1, toReturn) {
//   console.log(val1);
//   return toReturn
// }
// function log2(val1, val2, toReturn) {
//   console.log(val1, val2)
//   return toReturn
// }

