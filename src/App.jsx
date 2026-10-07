import "./App.css";

function App() {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand">
          <div className="brand-icon">V</div>

          <div>
            <h1>VCAR</h1>
            <p>Gestão de Viagens</p>
          </div>
        </div>

        <div className="login-title">
          <h2>Bem-vindo</h2>
          <p>Entre para acessar sua empresa</p>
        </div>

        <form className="login-form">
          <label>
            E-mail
            <input
              type="email"
              placeholder="seu@email.com"
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              placeholder="Digite sua senha"
            />
          </label>

          <button type="button">
            Entrar
          </button>
        </form>

        <p className="login-footer">
          VCAR Gestão de Viagens
        </p>
      </section>
    </main>
  );
}

export default App;
