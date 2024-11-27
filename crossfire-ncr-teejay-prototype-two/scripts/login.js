/* ===== Authentication ===== */

const auth = firebase.auth();

const loginForm = document.querySelector('.login.form');
const resetForm = document.querySelector('.reset.form');

const anchors = document.querySelectorAll('a');
anchors.forEach(anchor => {
    anchor.addEventListener('click', () => {
        const id = anchor.id;
        switch (id) {
            case 'loginLabel':
                loginForm.style.display = 'block';
                resetForm.style.display = 'none';
                break;
            case 'resetLabel':
                loginForm.style.display = 'none';
                resetForm.style.display = 'block';
                break;
        }
    });
});

function createUser() {
    const name = document.querySelector('#name').value.trim();
    const username = document.querySelector('#username').value.trim();
    const email = document.querySelector('#email').value.trim();
    const password = document.querySelector('#password').value;
    const userType = document.querySelector('#userType').value;

    if (!name || !username || !email || !password || !userType) {
        alert('Please fill in all fields.');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const uid = user.uid;

            firestore.collection('users').doc(uid).set({
                name: name,
                username: username,
                email: email,
                userType: userType,
            })
                .then(() => {
                    console.log('User data saved to Firestore.');
                })
                .catch((error) => {
                    console.error('Error saving user data to Firestore:', error);
                    alert('Error saving user information. Please try again later.');
                });

            user.sendEmailVerification()
                .then(() => {
                    alert('Verification email sent. Please check your inbox and verify your email before signing in.');
                })
                .catch((error) => {
                    console.error('Error sending verification email:', error);
                    alert('Error sending verification email. Please try again later.');
                });
        })
        .catch((error) => {
            console.error('Error creating user:', error);

            let errorMessage;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'The email address is already in use by another account.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'The password must be at least 6 characters.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'The email address is not valid.';
                    break;
                default:
                    errorMessage = 'An unexpected error occurred. Please try again.';
            }
            alert(errorMessage);
        });
}

function loginUser() {
    const email = document.querySelector('#inUsr').value.trim();
    const password = document.querySelector('#inPass').value;

    if (!email || !password) {
        alert('Please fill in both email and password fields.');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            if (user.emailVerified) {
                console.log('User is signed in with a verified email.');
                alert('Login successful! Redirecting to the dashboard...');
                location.href = "index.html";
            } else {
                alert('Your email is not verified. Please check your inbox and verify your email.');
            }
        })
        .catch((error) => {
            let errorMessage;
            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email. Please sign up or try again.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'The email address is not valid. Please check and try again.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled. Please contact support.';
                    break;
                default:
                    errorMessage = 'An error occurred during login. Please try again later.';
            }
            alert(errorMessage);
            console.error('Login error:', error);
        });
}

function sendPasswordResetEmail() {
    const emailForReset = document.querySelector('#resetinp').value.trim();
    if (emailForReset.length > 0) {
        auth.sendPasswordResetEmail(emailForReset)
            .then(() => {
                alert('Password reset email sent. Please check your inbox to reset your password.');
                loginForm.style.display = 'block';
                resetForm.style.display = 'none';
            })
            .catch((error) => {
                alert('Error sending password reset email. ');
            });
    }
}

function signOutUser() {
    const confirmSignOut = confirm("Are you sure you want to log out?");
    if (confirmSignOut) {
        auth.signOut()
            .then(() => {
                // Clear session and local storage to ensure no residual user data
                sessionStorage.clear();
                localStorage.clear();

                // Redirect to login page, replacing the current history entry
                window.location.replace("login.html");

                // Push the current state to history to prevent going back to the logged-in page
                window.history.pushState(null, null, window.location.href); // Push current page state to history
                window.onpopstate = function () {
                    window.history.go(1); // Force forward to prevent back navigation
                };

                console.log('User signed out successfully');
                alert('You have been logged out successfully.');
            })
            .catch((error) => {
                console.error('Error signing out:', error);
                alert('An error occurred during logout. Please try again.');
            });
    } else {
        console.log('Sign-out canceled by user.');
    }
}