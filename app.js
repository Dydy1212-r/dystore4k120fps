import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ==============================
// SUPABASE
// ==============================

const SUPABASE_URL =
  "https://glpkadgmsaozmcebyrxw.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_UYD86Z2gQD5o8BMfuP5IHw__bIcUX0C";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==============================
// ELEMENTS
// ==============================

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const signupBtn =
  document.getElementById("signupBtn");

const loginBtn =
  document.getElementById("loginBtn");

const authStatus =
  document.getElementById("authStatus");


// ==============================
// STATUS
// ==============================

function status(message, type = "") {

  authStatus.textContent = message;

  if (type === "error") {
    authStatus.style.color = "#ff5555";
  }

  else if (type === "success") {
    authStatus.style.color = "#7CFF7C";
  }

  else {
    authStatus.style.color = "#777";
  }

}


// ==============================
// SIGN UP
// ==============================

signupBtn.addEventListener(
  "click",
  async () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {

      status(
        "Please enter email and password.",
        "error"
      );

      return;
    }


    if (password.length < 6) {

      status(
        "Password must be at least 6 characters.",
        "error"
      );

      return;
    }


    signupBtn.disabled = true;

    signupBtn.textContent =
      "CREATING...";

    status(
      "Creating account..."
    );


    try {

      const { data, error } =
        await supabase.auth.signUp({

          email: email,

          password: password

        });


      console.log(
        "SIGN UP RESULT:",
        data
      );


      if (error) {
        throw error;
      }


      if (data.user) {

        status(
          "Account created! Check your Gmail.",
          "success"
        );

      }

      else {

        status(
          "Something went wrong.",
          "error"
        );

      }

    }

    catch (error) {

      console.error(
        "SIGN UP ERROR:",
        error
      );


      status(
        error.message ||
        "Sign up failed.",
        "error"
      );

    }


    finally {

      signupBtn.disabled = false;

      signupBtn.textContent =
        "SIGN UP";

    }

  }
);


// ==============================
// LOGIN
// ==============================

loginBtn.addEventListener(
  "click",
  async () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {

      status(
        "Please enter email and password.",
        "error"
      );

      return;
    }


    loginBtn.disabled = true;

    loginBtn.textContent =
      "LOGGING IN...";


    try {

      const { data, error } =
        await supabase.auth.signInWithPassword({

          email: email,

          password: password

        });


      console.log(
        "LOGIN RESULT:",
        data
      );


      if (error) {
        throw error;
      }


      status(
        "LOGIN SUCCESS ✓",
        "success"
      );


      loginBtn.textContent =
        "LOGGED IN";

    }

    catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      status(
        error.message ||
        "Login failed.",
        "error"
      );


      loginBtn.disabled = false;

      loginBtn.textContent =
        "LOGIN";

    }

  }
);


// ==============================
// CHECK SESSION
// ==============================

async function checkSession() {

  try {

    const { data } =
      await supabase.auth.getSession();


    if (data.session) {

      console.log(
        "Already logged in:",
        data.session.user.email
      );

    }

  }

  catch (error) {

    console.error(
      "SESSION ERROR:",
      error
    );

  }

}


checkSession();
