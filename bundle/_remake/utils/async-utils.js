// e.g. let [posts, postErr] = await capture(getUsersPosts(userId));
//   source: https://dev.to/sobiodarlington/better-error-handling-with-async-await-2e5m
const capture = (promise) => {
  return promise
    .then(data => ([data, undefined]))
    .catch(error => Promise.resolve([undefined, error]));
}

export {
  capture
}