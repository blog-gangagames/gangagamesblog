// Fix for homepage loading issues
(function() {
  // Add null checks for category color application
  var originalInitADA = window.initADA;
  window.initADA = function() {
    try {
      if (originalInitADA) originalInitADA();
    } catch (err) {
      console.warn('Error in initADA:', err);
    }
  };

  // Add error handling for slick initialization
  var originalSlick = $.fn.slick;
  if (originalSlick) {
    $.fn.slick = function() {
      try {
        return originalSlick.apply(this, arguments);
      } catch (err) {
        console.warn('Error in slick initialization:', err);
        return this;
      }
    };
  }

  // Preload images to speed up rendering
  function preloadImages() {
    var imagesToPreload = ['/images/gangalogo.png'];
    imagesToPreload.forEach(function(src) {
      var img = new Image();
      img.src = src;
    });
  }

  // Execute immediately
  preloadImages();
  
  // Reduce preloader timing
  // Show content immediately when data is ready
  window.MIN_PRELOAD_MS = 0;
  window.MAX_PRELOAD_MS = 0;
})();