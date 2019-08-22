function ajax ({url, method, data, callback}) {
  fetch(url, {
    method: method,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(data),
  })
  .then(res => res.json())
  .then(res => {
    callback(res);
  });
}

export function ajaxSimple (url, method, data, callback) {
  ajax({url, method, data, callback});
}

export function ajaxPost (url, data, callback) {
  ajaxSimple(url, "POST", data, callback);
}

export function ajaxGet (url, data, callback) {
  ajaxSimple(url, "GET", data, callback);
}