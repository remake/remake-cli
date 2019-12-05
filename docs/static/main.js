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