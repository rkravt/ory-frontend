import React, { useState, useEffect, useRef } from "react";
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
  const [session, setSession] = useState(null); // null = неизвестно, объект = сессия, false = нет сессии
  const [flow, setFlow] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const checkSession = async () => {
    try {
      const { data } = await axios.get(`${KRATOS_PUBLIC}/sessions/whoami`, {
        withCredentials: true,
      });
      setSession(data);
    } catch (err) {
      setSession(null);
    }
  };

  // Вариант 3: проверяем сессию только если она неизвестна и только при смене роута
  useEffect(() => {
    if (session === null) {
      checkSession();
    }
  }, [location.pathname, session]);

  const handleRegister = async values => {
    try {
      const { data: regFlow } = await axios.get(
        `${KRATOS_PUBLIC}/self-service/registration/browser`,
        { withCredentials: true }
      );

      const csrfToken = getCsrfToken(regFlow);

      await axios.post(
        `${KRATOS_PUBLIC}/self-service/registration?flow=${regFlow.id}`,
        {
          method: "password",
          csrf_token: csrfToken,
          traits: {
            phone: values.phone.startsWith("+")
              ? values.phone
              : `+7${values.phone.replace(/\D/g, "").slice(1)}`,
            name: { first: values.firstName, last: values.lastName },
            tos_accepted: values.tos_accepted,
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
      navigate("/verify-sms"); // ← теперь сюда после регистрации
    } catch (error) {
      if (error.response?.data) setFlow(error.response.data);
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
          identifier: values.phone,
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
      if (error.response?.data) setFlow(error.response.data);
    }
  };

  const handleVKLogin = () => {
    window.location.href = `${KRATOS_PUBLIC}/self-service/login/browser?provider=vk`;
  };

  const handleLogout = async () => {
    try {
      const { data } = await axios.get(
        `${KRATOS_PUBLIC}/self-service/logout/browser`,
        {
          withCredentials: true,
        }
      );
      window.location.href = data.logout_url;
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="App">
      <Routes>
        {/* ЛОГИН */}
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

        {/* РЕГИСТРАЦИЯ */}
        <Route
          path="/registration"
          element={
            <div>
              <h1>Регистрация</h1>
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
                onSubmit={e => {
                  e.preventDefault();
                  handleRegister({
                    phone: e.target.phone.value.trim(),
                    firstName: e.target.firstName.value.trim(),
                    lastName: e.target.lastName.value.trim(),
                    password: e.target.password.value,
                    tos_accepted: e.target.tos.checked,
                  });
                }}
              >
                <input name="firstName" placeholder="Имя" required />
                <input name="lastName" placeholder="Фамилия" required />
                <input
                  name="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Пароль (мин. 6 символов)"
                  minLength={6}
                  required
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
                  </a>
                </label>
                <button type="submit">Зарегистрироваться</button>
              </form>
            </div>
          }
        />

        {/* ПОДТВЕРЖДЕНИЕ SMS */}
        <Route
          path="/verify-sms"
          element={
            <div>
              <h1>Подтвердите номер</h1>
              <p
                style={{
                  color: "#475569",
                  margin: "1rem 0 2rem",
                  textAlign: "center",
                }}
              >
                Мы отправили 6-значный код на
                <br />
                <strong>{session?.identity?.traits?.phone}</strong>
              </p>
              {flow?.ui?.messages?.map((m, i) => (
                <p
                  key={i}
                  style={{
                    color: "#dc2626",
                    background: "#fef2f2",
                    padding: "1rem",
                    borderRadius: "8px",
                    margin: "1rem 0",
                  }}
                >
                  {m.text}
                </p>
              ))}
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const code = e.target.code.value.trim();
                  try {
                    let verificationFlow =
                      flow?.type === "verification" ? flow : null;
                    if (!verificationFlow) {
                      const { data } = await axios.get(
                        `${KRATOS_PUBLIC}/self-service/verification/browser`,
                        { withCredentials: true }
                      );
                      verificationFlow = data;
                      setFlow(data);
                    }
                    await axios.post(
                      `${KRATOS_PUBLIC}/self-service/verification?flow=${verificationFlow.id}`,
                      {
                        method: "code",
                        csrf_token: getCsrfToken(verificationFlow),
                        code,
                      },
                      {
                        withCredentials: true,
                        headers: {
                          "X-CSRF-Token": getCsrfToken(verificationFlow),
                        },
                      }
                    );
                    await checkSession();
                    navigate("/dashboard");
                  } catch (error) {
                    if (error.response?.data) setFlow(error.response.data);
                  }
                }}
              >
                <input
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  required
                  autoFocus
                  onInput={e =>
                    (e.target.value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6))
                  }
                />
                <button type="submit">Подтвердить</button>
              </form>
              <p style={{ marginTop: "1.5rem", fontSize: "0.95rem" }}>
                Не пришёл код?{" "}
                <a
                  href="#"
                  onClick={async e => {
                    e.preventDefault();
                    try {
                      await axios.post(
                        `${KRATOS_PUBLIC}/self-service/verification/api`,
                        { method: "code" },
                        { withCredentials: true }
                      );
                      alert("Новый код отправлен!");
                    } catch {
                      alert("Ошибка");
                    }
                  }}
                >
                  Отправить ещё раз
                </a>
              </p>
            </div>
          }
        />

        {/* ДАШБОРД */}
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
