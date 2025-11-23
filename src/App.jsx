import { useState, useEffect } from 'react';

// Login Component
const Login = () => {
  const [flowId, setFlowId] = useState('');
  const [flow, setFlow] = useState(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const KRATOS_PUBLIC_URL = 'http://localhost:4433';

  useEffect(() => {
    initializeFlow();
  }, []);

  const initializeFlow = async () => {
    try {
      setLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const existingFlow = urlParams.get('flow');
      const loginChallenge = urlParams.get('login_challenge');
      
      if (!existingFlow) {
        let redirectUrl = `${KRATOS_PUBLIC_URL}/self-service/login/browser`;
        const params = new URLSearchParams();
        if (loginChallenge) {
          params.append('login_challenge', loginChallenge);
        }
        if (params.toString()) {
          redirectUrl += `?${params.toString()}`;
        }
        
        window.location.href = redirectUrl;
        return;
      }

      const response = await fetch(`${KRATOS_PUBLIC_URL}/self-service/login/flows?id=${existingFlow}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch flow');
      }

      const data = await response.json();
      setFlow(data);
      setFlowId(data.id);
      setError('');
    } catch (err) {
      setError('Не удалось инициализировать форму входа. Попробуйте обновить страницу.');
      console.error('Flow initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${KRATOS_PUBLIC_URL}/self-service/login?flow=${flowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          method: 'password',
          identifier: phone,
          password: password
        })
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok && data.session) {
        if (data.return_to) {
          window.location.href = data.return_to;
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        const errorMessage = data.ui?.messages?.[0]?.text || 
                           data.error?.message ||
                           'Неверный телефон или пароль';
        setError(errorMessage);
        console.error('Error response:', data);
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 1) return cleaned;
    if (cleaned.length <= 4) return `+${cleaned}`;
    if (cleaned.length <= 7) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && phone && password) {
      handleSubmit();
    }
  };

  if (loading && !flow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Вход в систему</h1>
          <p className="text-gray-600 mt-2">Введите номер телефона и пароль</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Телефон
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              onKeyPress={handleKeyPress}
              placeholder="+7 (___) ___-__-__"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={loading}
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите пароль"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !phone || !password}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Вход...
              </span>
            ) : (
              'Войти'
            )}
          </button>

          <div className="text-center">
            <a href="/registration" className="text-sm text-indigo-600 hover:text-indigo-700">
              Нет аккаунта? Зарегистрироваться
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Нажимая кнопку "Войти", вы принимаете{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-700">
              Пользовательское соглашение
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const KRATOS_PUBLIC_URL = 'http://localhost:4433';

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch(`${KRATOS_PUBLIC_URL}/sessions/whoami`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('Ошибка проверки сессии');
      console.error('Session check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${KRATOS_PUBLIC_URL}/self-service/logout/browser`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.logout_url;
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Ошибка при выходе');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Выйти
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                🎉 Вход выполнен успешно!
              </h3>
              <p className="text-blue-600 text-sm">
                Добро пожаловать в систему.
              </p>
            </div>

            {session && session.identity && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Информация профиля
                </h3>
                <div className="space-y-3">
                  {session.identity.traits?.phone && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Телефон:</span>
                      <p className="text-sm text-gray-800 bg-white px-3 py-2 rounded mt-1">
                        {session.identity.traits.phone}
                      </p>
                    </div>
                  )}
                  
                  {session.identity.traits?.name && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Имя:</span>
                      <p className="text-sm text-gray-800 bg-white px-3 py-2 rounded mt-1">
                        {session.identity.traits.name.first} {session.identity.traits.name.last}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium text-gray-600">ID пользователя:</span>
                    <p className="text-xs text-gray-600 font-mono bg-white px-3 py-2 rounded mt-1 break-all">
                      {session.identity.id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Registration Component
const Registration = () => {
  const [flowId, setFlowId] = useState('');
  const [flow, setFlow] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    firstName: '',
    lastName: '',
    tosAccepted: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const KRATOS_PUBLIC_URL = 'http://localhost:4433';

  useEffect(() => {
    initializeFlow();
  }, []);

  const initializeFlow = async () => {
    try {
      setLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const existingFlow = urlParams.get('flow');
      
      if (!existingFlow) {
        window.location.href = `${KRATOS_PUBLIC_URL}/self-service/registration/browser`;
        return;
      }

      const response = await fetch(`${KRATOS_PUBLIC_URL}/self-service/registration/flows?id=${existingFlow}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch flow');
      }

      const data = await response.json();
      setFlow(data);
      setFlowId(data.id);
      setError('');
    } catch (err) {
      setError('Не удалось инициализировать форму регистрации. Попробуйте обновить страницу.');
      console.error('Flow initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.tosAccepted) {
      setError('Необходимо принять Пользовательское соглашение');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${KRATOS_PUBLIC_URL}/self-service/registration?flow=${flowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          method: 'password',
          password: formData.password,
          traits: {
            phone: formData.phone,
            name: {
              first: formData.firstName,
              last: formData.lastName
            },
            tos_accepted: formData.tosAccepted
          }
        })
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok && data.session) {
        window.location.href = '/dashboard';
      } else {
        const errorMessage = data.ui?.messages?.[0]?.text || 
                           data.error?.message ||
                           'Ошибка регистрации';
        setError(errorMessage);
        console.error('Error response:', data);
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 1) return cleaned;
    if (cleaned.length <= 4) return `+${cleaned}`;
    if (cleaned.length <= 7) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading && !flow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
          <p className="text-gray-600 mt-2">Создайте новый аккаунт</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="Иван"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фамилия
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Иванов"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Телефон
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', formatPhone(e.target.value))}
              placeholder="+7 (___) ___-__-__"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Минимум 8 символов"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="tos"
              checked={formData.tosAccepted}
              onChange={(e) => updateField('tosAccepted', e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="tos" className="ml-2 text-sm text-gray-600">
              Я принимаю Пользовательское соглашение и Подтверждение данных и согласие на рассылку
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !formData.phone || !formData.password || !formData.firstName || !formData.lastName}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Регистрация...
              </span>
            ) : (
              'Зарегистрироваться'
            )}
          </button>

          <div className="text-center">
            <a href="/" className="text-sm text-indigo-600 hover:text-indigo-700">
              Уже есть аккаунт? Войти
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App with routing
const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (currentPath === '/dashboard') {
    return <Dashboard />;
  }

  if (currentPath === '/registration') {
    return <Registration />;
  }

  return <Login />;
};

export default App;