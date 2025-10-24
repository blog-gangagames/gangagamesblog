// Sidebar search box wiring: redirects to search-result with query
(function(){
  function init(){
    try {
      var scope = document.querySelector('.widget__form-search-bar');
      if (!scope) return;
      var input = scope.querySelector('input');
      var btn = scope.querySelector('button');
      var go = function(){
        var q = (input && input.value ? input.value : '').trim();
        if (!q) return;
        var url = 'search-result.html?q=' + encodeURIComponent(q);
        window.location.href = url;
      };
      if (btn) btn.addEventListener('click', function(e){ e.preventDefault(); go(); });
      if (input) input.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); go(); } });
    } catch (e) {}
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();