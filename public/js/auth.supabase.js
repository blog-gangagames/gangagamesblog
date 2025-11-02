// Static site Supabase auth wiring
(function () {
  if (typeof window === 'undefined') return;
  const client = window.supabaseClient || (typeof supabase !== 'undefined' ? supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null);
  if (!client) {
    console.warn('Supabase client not available. Auth disabled.');
    return;
  }

  async function signIn(email, password, remember) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const emailConfirmed = Boolean(data?.session?.user?.email_confirmed_at);
    if (!emailConfirmed) {
      // Immediately sign out to prevent access before confirmation
      try { await client.auth.signOut(); } catch {}
      const resend = confirm('Your email is not confirmed yet. Would you like us to resend the confirmation email?');
      if (resend) {
        try { await client.auth.resend({ type: 'signup', email }); } catch {}
      }
      throw new Error('Email not confirmed. Please check your inbox.');
    }
    if (remember) {
      try { localStorage.setItem('gg_user_session', JSON.stringify(data.session)); } catch {}
    }
    return data.session;
  }

  async function signUp(payload) {
    const { name, email, password, userType, phone, country } = payload;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { name, userType, accountType: userType, phone, country },
        // Redirect confirmed email link to production admin base
        emailRedirectTo: "https://www.gangagamesblog.com/admin",
      },
    });
    if (error) throw error;
    // profile auto-created by DB trigger; optional profile fetch
    return data.user;
  }

  function bindForms() {
    const $ = window.jQuery || window.$;
    if (!$) return;
    $('#signInForm').on('submit', async function (e) {
      e.preventDefault();
      const email = $('#signInEmail').val();
      const password = $('#signInPassword').val();
      const rememberMe = $('#rememberMe').is(':checked');
      if (!email || !password) { alert('Please fill in all fields'); return; }
      try {
        await signIn(String(email), String(password), !!rememberMe);
        $('#signInModal').modal('hide');
        // Redirect to admin app on production domain
        setTimeout(() => {
          try { window.location.href = new URL('/admin/', window.location.origin).href; }
          catch { window.location.href = '/admin/'; }
        }, 500);
      } catch (err) {
        alert('Sign in failed: ' + (err?.message || err));
      }
    });

    $('#signUpForm').on('submit', async function (e) {
      e.preventDefault();
      const name = $('#signUpName').val();
      const email = $('#signUpEmail').val();
      const password = $('#signUpPassword').val();
      const confirmPassword = $('#signUpConfirmPassword').val();
      const userType = $('#userType').val();
      const agreeTerms = $('#agreeTerms').is(':checked');
      const phone = $('#signUpPhone').val();
      const country = $('#signUpCountry').val();
      if (!name || !email || !password || !confirmPassword) { alert('Please fill in all fields'); return; }
      if (password !== confirmPassword) { alert('Passwords do not match'); return; }
      if (!agreeTerms) { alert('Please agree to the Terms and Conditions'); return; }
      try {
        await signUp({ name: String(name), email: String(email), password: String(password), userType: String(userType || 'author'), phone: String(phone||''), country: String(country||'') });
        $('#signUpModal').modal('hide');
        // Keep user on the page; confirmation link will redirect to dashboard
        alert('Registration successful! Please check your email to confirm.');
      } catch (err) {
        alert('Sign up failed: ' + (err?.message || err));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindForms);
  } else {
    bindForms();
  }
})();