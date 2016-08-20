function MyPromise(fn) {
  this._thenClauses = [];
  const resolve = (val) => this._thenClauses.forEach(fn => fn(val))
  const reject  = (idk) => console.log("Uhhhh, this is a mistake >.<")
  fn(resolve, reject)
}
MyPromise.prototype.then = function(fn) {
  var promise = new MyPromise((resolve, reject) => {
    this._thenClauses.push(val => {
      var result = fn(val)
      if(result && result.constructor === MyPromise)
        result.then(val => resolve(val))
      else
        resolve(result)
    })
  })
  return promise
}

const PromiseClass = MyPromise

var t1 = 10
new PromiseClass((resolve, reject) => setTimeout(() => resolve(10), t1))
      .then(num => log('first then: ',  num, num*2))
      .then(num => log('second then: ', num, num*2))
      .then(num => log('last then: ',   num, num*2))
      .then(_   => log('---------------'))

new PromiseClass((resolve, reject) => setTimeout(() => resolve('first'), t1+1))
      .then(val => log('time 1: ', new Date(), "a"))
      .then(val => new PromiseClass(resolve => setTimeout(()=>resolve('second'), 1000)))
      .then(val => log('time 2: ', new Date(), "b"))

function log(val1, val2, toReturn) {
  console.log(val1, val2)
  return toReturn
}

