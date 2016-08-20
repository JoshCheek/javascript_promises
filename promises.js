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
