document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const modal = document.getElementById('authModal');
    const closeBtn = document.querySelector('.close');
    const authTitle = document.getElementById('authTitle');
    const authForm = document.getElementById('authForm');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    let isLogin = true;

    loginBtn.onclick = function() {
        modal.style.display = "block";
        authTitle.textContent = "Iniciar sesión";
        authSubmitBtn.textContent = "Entrar";
        isLogin = true;
    };
    registerBtn.onclick = function() {
        modal.style.display = "block";
        authTitle.textContent = "Registrarse";
        authSubmitBtn.textContent = "Registrarse";
        isLogin = false;
    };
    closeBtn.onclick = function() {
        modal.style.display = "none";
    };
    window.onclick = function(event) {
        if (event.target == modal) modal.style.display = "none";
    };

    authForm.onsubmit = async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        if (!username || !password) return alert('Completa todos los campos');
        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('token', data.token);
                window.location.href = 'calendar.html';
            } else {
                alert(data.error || 'Error de autenticación');
            }
        } catch (err) {
            alert('Error de red');
        }
    };
}); 