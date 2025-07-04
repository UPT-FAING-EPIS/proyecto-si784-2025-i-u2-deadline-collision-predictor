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
        modal.classList.remove('hide');
        modal.classList.add('show');
        authTitle.textContent = "Iniciar sesión";
        authSubmitBtn.textContent = "Entrar";
        isLogin = true;
        document.getElementById('telefonoGroup').style.display = 'none';
    };
    registerBtn.onclick = function() {
        modal.classList.remove('hide');
        modal.classList.add('show');
        authTitle.textContent = "Registrarse";
        authSubmitBtn.textContent = "Registrarse";
        isLogin = false;
        document.getElementById('telefonoGroup').style.display = 'block';
    };
    closeBtn.onclick = function() {
        modal.classList.remove('show');
        modal.classList.add('hide');
        setTimeout(() => { modal.style.display = "none"; }, 300);
    };
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.classList.remove('show');
            modal.classList.add('hide');
            setTimeout(() => { modal.style.display = "none"; }, 300);
        }
    };

    authForm.onsubmit = async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        if (!username || !password) return alert('Completa todos los campos');
        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isLogin ? { username, password } : { username, password, telefono })
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