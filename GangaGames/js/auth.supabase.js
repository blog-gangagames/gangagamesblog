// Lightweight Supabase auth wiring for the static homepage forms
// Requires js/supabase.config.js and the supabase-js CDN

;(function () {
  var SUPABASE_URL = window.SUPABASE_URL
  var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Missing URL/anon key. Set in js/supabase.config.js or localStorage.')
    return
  }

  // Initialize Supabase client via CDN global
  // Ensure you include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  var sb = window.supabase && window.supabase.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null
  if (!sb) {
    console.error('[Supabase] supabase-js CDN not loaded.')
    return
  }

  // Helper to create profile after sign up, in case DB trigger is not present or failed
  async function ensureProfile(session, extra) {
    try {
      if (!session || !session.user) return
      var user = session.user
      var email = user.email
      var id = user.id
      // Attempt upsert to public.profiles (RLS allows owner)
      var payload = {
        id: id,
        email: email,
        name: extra && extra.name ? extra.name : (email ? email.split('@')[0] : 'User'),
        user_type: extra && extra.userType ? extra.userType : 'author',
        signup_date: new Date().toISOString().split('T')[0],
        password_length: extra && extra.password ? String(extra.password).length : null,
        last_login: new Date().toISOString(),
      }
      await sb.from('profiles').upsert(payload, { onConflict: 'id' })
    } catch (err) {
      console.warn('[Supabase] ensureProfile warning:', err)
    }
  }

  // Attach handlers once DOM ready
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn)
    } else {
      fn()
    }
  }

  ready(function () {
    var $ = window.jQuery || window.$
    // Sign In
    var signInForm = document.getElementById('signInForm')
    if (signInForm) {
      signInForm.addEventListener('submit', async function (e) {
        e.preventDefault()
        var email = (document.getElementById('signInEmail') || {}).value
        var password = (document.getElementById('signInPassword') || {}).value
        if (!email || !password) {
          alert('Please enter email and password')
          return
        }
        var { data, error } = await sb.auth.signInWithPassword({ email: email, password: password })
        if (error) {
          alert('Sign in failed: ' + error.message)
          return
        }
        await ensureProfile(data.session)
        if ($) $('#signInModal').modal('hide')
        // Redirect to admin app on production domain
        try { window.location.href = new URL('/admin/', window.location.origin).href }
        catch { window.location.href = '/admin/' }
      })
    }

    // Sign Up
    var signUpForm = document.getElementById('signUpForm')
    if (signUpForm) {
      signUpForm.addEventListener('submit', async function (e) {
        e.preventDefault()
        var name = (document.getElementById('signUpName') || {}).value
        var email = (document.getElementById('signUpEmail') || {}).value
        var password = (document.getElementById('signUpPassword') || {}).value
        var confirmPassword = (document.getElementById('signUpConfirmPassword') || {}).value
        var userTypeSelect = document.getElementById('userType')
        var userType = userTypeSelect ? userTypeSelect.value : 'author'
        var agreeTerms = (document.getElementById('agreeTerms') || {}).checked
        if (!name || !email || !password || !confirmPassword) {
          alert('Please fill in all fields')
          return
        }
        if (password !== confirmPassword) {
          alert('Passwords do not match')
          return
        }
        if (!agreeTerms) {
          alert('Please agree to the Terms and Conditions')
          return
        }
        var { data, error } = await sb.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { name: name, user_type: userType },
          },
        })
        if (error) {
          alert('Sign up failed: ' + error.message)
          return
        }
        // If email confirmation is ON, user must confirm before session exists
        if (!data.session) {
          alert('Check your email to confirm your account.')
          return
        }
        await ensureProfile(data.session, { name: name, userType: userType, password: password })
        if ($) $('#signUpModal').modal('hide')
        try { window.location.href = new URL('/admin/', window.location.origin).href }
        catch { window.location.href = '/admin/' }
      })
    }
  })
})()