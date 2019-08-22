document.body.addEventListener("click", function (event) {
  if (event.target.closest(".js-pd")) {
    event.preventDefault();
  }
});