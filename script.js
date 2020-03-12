function PromiseAny(iterable) {
  if (iterable[Symbol.iterator] && !iterable[Symbol.iterator]().next().value)
    return Promise.resolve();
  return new Promise((resolve, reject) => {
    let isResolved = false;
    let promiseRejectArray;
    let promiseRejectedCount = 0;
    let promiseCount = 0;

    for (let promise of iterable) {
      if (!(promise instanceof Promise)) resolve(promise);
      const promiseIndex = promiseCount;
      promiseCount += 1;
      promise
        .then(result => {
          if (isResolved) return;
          isResolved = true;
          resolve(result);
        })
        .catch(error => {
          promiseRejectArray[promiseIndex] = error;
          promiseRejectedCount += 1;
          if (promiseRejectedCount === promiseCount) reject(promiseRejectArray);
        });
    }

    promiseRejectArray = new Array(promiseCount);
  });
}

Promise._any = PromiseAny;

function PromiseAllSettled(iterable) {
  return new Promise(resolve => {
    let promiseArray;
    let promiseCount = 0;
    for (let promise of iterable) {
      const promiseIndex = promiseCount;
      promiseCount += 1;
      if (!(promise instanceof Promise)) promise = Promise.resolve(promise);
      promise
        .then(result => {
          promiseArray[promiseIndex] = { status: "fullfilled", value: result };
          if (!promiseArray.includes(undefined)) resolve(promiseArray);
        })
        .catch(error => {
          promiseArray[promiseIndex] = { status: "rejected", reason: error };
          if (!promiseArray.includes(undefined)) resolve(promiseArray);
        });
    }
    promiseArray = new Array(promiseCount);
  });
}

// AllSettled implementaions with Promise.all
function PromiseAllSettled2(iterable) {
  return Promise.all(
    Array.from(iterable).map(promise => {
      return promise.then(
        result => {
          return { status: "fullfilled", value: result };
        },
        error => {
          return { status: "rejected", reason: error };
        }
      );
    })
  );
}

Promise._allSettled = PromiseAllSettled;

Promise.prototype._finally = function(fn) {
  fn();
  return this;
};

// TESTS
const testMethods = async () => {
  function promiseFactory(success) {
    return new Promise((resolve, reject) => {
      setTimeout(success ? resolve : reject, Math.random() * 100);
    });
  }

  await Promise._any([])
    .then(res => console.log("[Promise._any] empty success", res))
    .catch(err => console.log("[Promise._any] empty errors", err));
  await Promise._any("😀")
    .then(res => console.log("[Promise._any] notPromises success", res))
    .catch(err => console.log("[Promise._any] notPromises errors", err));
  await Promise._any([promiseFactory(true), promiseFactory(true)])
    .then(res => console.log("[Promise._any] successPromises success", res))
    .catch(err => console.log("[Promise._any] successPromises errors", err));
  await Promise._any([promiseFactory(false), promiseFactory(false)])
    .then(res => console.log("[Promise._any] errorPromises success", res))
    .catch(err => console.log("[Promise._any] errorPromises errors", err));
  await Promise._any([promiseFactory(true), promiseFactory(false)])
    .then(res => console.log("[Promise._any] allPromises success", res))
    .catch(err => console.log("[Promise._any] allPromises errors", err));

  await Promise._allSettled("😀😁😂🤣😃").then(res =>
    console.log("[Promise._allSettled] notPromises", res)
  );
  await Promise._allSettled([promiseFactory(true), promiseFactory(true)]).then(res =>
    console.log("[Promise._allSettled] successPromises", res)
  );
  await Promise._allSettled([promiseFactory(false), promiseFactory(false)]).then(res =>
    console.log("[Promise._allSettled] errorPromises", res)
  );
  await Promise._allSettled([promiseFactory(true), promiseFactory(false)]).then(res =>
    console.log("[Promise._allSettled] allPromises", res)
  );

  await promiseFactory(true)
    ._finally(() => console.log("[Promise.prototype._finally] do something"))
    .then(res => console.log("[Promise.prototype._finally] success", res))
    .catch(err => console.log("[Promise.prototype._finally] error", err));

  await promiseFactory(false)
    ._finally(() => console.log("[Promise.prototype._finally] do something"))
    .then(res => console.log("[Promise.prototype._finally] success", res))
    .catch(err => console.log("[Promise.prototype._finally] error", err));
};

setTimeout(testMethods, 500);
