var slideout = new Slideout({
  'panel': document.getElementById('panel'),
  'menu': document.getElementById('menu'),
  'padding': 256,
  'tolerance': 70
});

// Toggle button
document.querySelector('.toggle-button').addEventListener('click', function() {
  slideout.toggle();
});

Array.from(document.querySelectorAll("iframe")).forEach(el => {
  var wrapper = document.createElement('div');
  wrapper.classList.add("video-container");
  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
});


// add mobile menu

let sidebarElem = document.querySelector(".sidebar");
let sidebarElemCopy = sidebarElem.cloneNode(true);
let mobileMenuElem = document.getElementById("menu");

sidebarElemCopy.classList.remove("hide-on-mobile");
sidebarElemCopy.classList.add("mobile");

mobileMenuElem.insertBefore(sidebarElemCopy, mobileMenuElem.firstChild);











