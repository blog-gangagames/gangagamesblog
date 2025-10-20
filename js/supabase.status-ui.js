// Simple Supabase status banner; listens to healthcheck event and displays status
(function(){
  function ready(fn){ if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn); } else { fn(); } }
  function createBanner(){
    var el = document.createElement('div');
    el.id = 'supabaseStatusBanner';
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.right = '12px';
    el.style.zIndex = '9999';
    el.style.fontFamily = 'sans-serif';
    el.style.fontSize = '12px';
    el.style.padding = '8px 10px';
    el.style.borderRadius = '6px';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    el.style.background = '#444';
    el.style.color = '#fff';
    el.textContent = 'Supabase: checking…';
    document.body.appendChild(el);
    return el;
  }
  ready(function(){
    var banner = createBanner();
    function update(status){
      if (!status) return;
      if (status.ok) {
        banner.style.background = '#2e7d32';
        banner.textContent = 'Supabase OK — posts reachable ('+(status.dataLength||0)+')';
        setTimeout(function(){ try { banner.remove(); } catch(e){} }, 5000);
      } else {
        banner.style.background = '#c62828';
        banner.textContent = 'Supabase error: '+ (status.error || 'unknown');
      }
    }
    document.addEventListener('supabase-health', function(e){ update(e.detail); });
  });
})();