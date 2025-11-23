import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import axios from "axios";

const KRATOS_PUBLIC = "http://localhost:4433";

const getCsrfToken = flow => {
  if (!flow?.ui?.nodes) return "";
  const node = flow.ui.nodes.find(n => n.attributes?.name === "csrf_token");
  return node?.attributes?.value || "";
};

function App() {
  const [session, setSession] = useState(null);
  const [flow, setFlow] = useState(null); // текущий login/registration/verification flow
  const location = useLocation();
  const navigate = useNavigate();

  // Проверка сессии при загрузке
  const checkSession = async () => {
    try {
      const { data } = await axios.get(`${KRATOS_PUBLIC}/sessions/whoami`, {
        withCredentials: true,
      });
      setSession(data);
      if (
        data.active &&
        (location.pathname === "/" || location.pathname === "/login")
      ) {
        navigate("/dashboard");
      }
    } catch (err) {
      setSession(null);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleRegister = async values => {
    try {
      const { data: flow } = await axios.get(
        `${KRATOS_PUBLIC}/self-service/registration/browser`,
        { withCredentials: true }
      );

      const csrfToken = getCsrfToken(flow);

      await axios.post(
        `${KRATOS_PUBLIC}/self-service/registration?flow=${flow.id}`,
        {
          method: "password",
          csrf_token: csrfToken,
          traits: {
            phone: values.phone.startsWith("+")
              ? values.phone
              : `+7${values.phone.replace(/\D/g, "").slice(1)}`,
            name: {
              first: values.firstName,
              last: values.lastName,
            },
            tos_accepted: values.tos_accepted,
            // dept_id и position_id можно не отправлять — они не required
          },
          password: values.password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
        }
      );

      await checkSession();
      navigate("/dashboard");
    } catch (error) {
      console.error("Регистрация не удалась:", error.response?.data || error);
      if (error.response?.data) {
        setFlow(error.response.data);
      }
    }
  };
  const handleLogin = async values => {
    try {
      const { data: loginFlow } = await axios.get(
        `${KRATOS_PUBLIC}/self-service/login/browser`,
        { withCredentials: true }
      );

      const csrfToken = getCsrfToken(loginFlow);

      await axios.post(
        `${KRATOS_PUBLIC}/self-service/login?flow=${loginFlow.id}`,
        {
          method: "password",
          csrf_token: csrfToken,
          identifier: values.phone, // логин по телефону
          password: values.password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken, // ← обязательно
          },
        }
      );

      await checkSession();
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data) {
        setFlow(error.response.data);
      }
    }
  };

  // VK OIDC логин
  const handleVKLogin = () => {
    window.location.href = `${KRATOS_PUBLIC}/self-service/login/browser?provider=vk`;
  };

  // Логаут
  const handleLogout = async () => {
    try {
      const { data } = await axios.get(
        `${KRATOS_PUBLIC}/self-service/logout/browser`,
        {
          withCredentials: true,
        }
      );
      window.location.href = data.logout_url;
    } catch (err) {
      window.location.href = "/";
    }
  };

  return (
    <div className="App">
      <Routes>
        {/* Главная / логин */}
        <Route
          path="/"
          element={
            session ? (
              <Navigate to="/dashboard" />
            ) : (
              <div>
                <h1>Вход</h1>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleLogin({
                      phone: e.target.phone.value,
                      password: e.target.password.value,
                    });
                  }}
                >
                  <input name="phone" placeholder="Телефон" required />
                  <input
                    name="password"
                    type="password"
                    placeholder="Пароль"
                    required
                  />
                  <button type="submit">Войти</button>
                </form>
                <button onClick={handleVKLogin}>Войти через VK</button>
                <p>
                  Нет аккаунта? <a href="/registration">Зарегистрироваться</a>
                </p>
              </div>
            )
          }
        />

        {/* Регистрация */}
        <Route
          path="/registration"
          element={
            <div>
              <h1>Регистрация</h1>

              {/* Ошибки от Kratos */}
              {flow?.ui?.messages?.map((msg, i) => (
                <p
                  key={i}
                  style={{
                    color: "red",
                    background: "#fee",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    margin: "1rem 0",
                  }}
                >
                  {msg.text}
                </p>
              ))}

              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const form = e.target;

                  await handleRegister({
                    phone: form.phone.value.trim(),
                    firstName: form.firstName.value.trim(),
                    lastName: form.lastName.value.trim(),
                    password: form.password.value,
                    tos_accepted: form.tos.checked,
                  });
                }}
              >
                <input
                  name="firstName"
                  placeholder="Имя"
                  required
                  style={{ marginBottom: "1rem" }}
                />
                <input
                  name="lastName"
                  placeholder="Фамилия"
                  required
                  style={{ marginBottom: "1rem" }}
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  pattern="\+?[0-9\s\-\(\)]{11,20}"
                  required
                  style={{ marginBottom: "1rem" }}
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Пароль (минимум 6 символов)"
                  minLength={6}
                  required
                  style={{ marginBottom: "1rem" }}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "1rem 0",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="checkbox"
                    name="tos"
                    required
                    style={{ marginRight: "0.5rem" }}
                  />
                  Я принимаю{" "}
                  <a
                    href="/tos"
                    target="_blank"
                    style={{ marginLeft: "4px", color: "#3b82f6" }}
                  >
                    Пользовательское соглашение
                  </a>{" "}
                  и даю согласие на обработку данных
                </label>

                <button
                  type="submit"
                  style={{ background: "#3b82f6", color: "white" }}
                >
                  Зарегистрироваться
                </button>
              </form>

              <p style={{ marginTop: "1.5rem" }}>
                Уже есть аккаунт? <a href="/">Войти</a>
              </p>
            </div>
          }
        />
        {/* Защищённый дашборд */}
        <Route
          path="/dashboard"
          element={
            session ? (
              <div>
                <h1>Добро пожаловать!</h1>
                <p>Вы вошли как {session.identity.traits.phone}</p>
                <button onClick={handleLogout}>Выйти</button>
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Другие роуты (settings, error, recovery и т.д.) можно добавить аналогично */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
