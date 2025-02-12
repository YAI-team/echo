# @yai/echo

**@yai/echo** — это лёгкий HTTP-клиент на основе встроенного `fetch`, с удобным синтаксисом, напоминающим [Axios](https://github.com/axios/axios). Библиотека поддерживает перехватчики (interceptors) для запросов и ответов, что облегчает добавление заголовков, обработку ошибок, логирование и другие аспекты работы с сетью.

## Установка

```bash
npm install @yai/echo
```

## Быстрый старт

После установки можно сразу использовать дефолтный экземпляр:

```bash
import echo from '@yai/echo'

echo.get('/users')
    .then(response => {
        // handle success
        console.log(response.data)
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })
    .finally(function () {
        // always executed
    });
```

## Создание экземпляра и базовая конфигурация

```bash
import echo from '@yai/echo'

// Задаем конфигурацию
const config: EchoCreateConfig = {
	baseURL: 'http://localhost:4200',
	headers: {
		'Content-Type': 'application/json'
	},
	credentials: 'include'
}

// Создаём экземпляр Echo
const echoBase = echo.create(config)

// Выполняем GET-запрос
customEcho.get('/users').then(response => {
    console.log(response.data)
})

// После чего можем использовать echoBase как обычный echo

const response = await echoBase.get('/users')
```

## Параметры конфигурации

При создании экземпляра можно указать:

```bash
{
    // предшественник `url`, если `url` не является абсолютным
    baseURL: 'https://api.example.com'

    // Это URL сервера, который будет использоваться для запроса
    url: '/user',

    // Это метод запроса, который будет использоваться при выполнении запроса
    method: 'get',

    // Объект заголовков
    headers: { 'Content-Type': 'application/json' },

    // Это параметры URL, которые будут отправлены вместе с запросом
    params: { limit: 10 },

    // Возвращаемый тип данных (например, 'json' | 'text' | 'blob' | 'formData' | ...)
    responseType: json, // по умолчанию

    // И другие поля поддерживаемые fetch.
}
```

## Методы запроса

Экземпляр (или echo по умолчанию) поддерживает методы:

- request(config)
- get(url, options?)
- post(url, body?, options?)
- put(url, body?, options?)
- patch(url, body?, options?)
- delete(url, options?)

Где:

- url — строка, указывающая на endpoint (если есть baseURL, то будет к нему добавляться).
- body — тело запроса для методов, позволяющих передавать данные (POST, PUT, PATCH).
- options — дополнительная конфигурация (заголовки, responseType, params и т.д.).

## Пример POST-запроса с телом:

```bash
const response = await echoBase.post('/login', { username: 'admin', password: '123456' })
```

## Перехватчики

@yai/echo поддерживает два типа перехватчиков:

- request — вызывается до выполнения запроса или при ошибке запроса.
- response — вызывается после получения ответа или при ошибке ответа.

Оба типа перехватчиков могут влиять на дальнейший ход запроса/ответа.

## Добавление перехватчика

Ключи request и response перехватчиков не конфликтуют, так что вы можете давать им одинаковые названия

```bash
const echoAuth = echo.create({ baseURL: 'https://api.example.com' })

// Добавим перехватчик request
echoAuth.interceptors.request.use(
    'auth',
    config => {
        // Изменяем заголовки для авторизации
        config.headers = {
            ...config.headers,
            Authorization: 'Bearer myToken'
        }
        return config
    },
    error => {
        // Можно перехватить ошибку, связанную с формированием запроса (например, если config некорректен)
        // В такие ошибки как правило попадает все что не относится к EchoError, то есть вызываемые до ожидаемых результатов

        if (isEchoError(error)) {
            // Всегда будет false
        }
        return error
    }
)

// Добавим перехватчик response
echoAuth.interceptors.response.use(
    'auth',
    response => {
        // Можно модифицировать ответ
        console.log('Response data:', response.data)
        return response
    },
    error => {
    // Обработка ошибок (например, 403)
    // Можно вернуть свой "фейковый" ответ и считать ошибку обработанной
    // Сделать пере-запрос по необходимости или пробросить ошибку дальше

    if (isEchoError(error)) {
        const originalRequest: any = error.request

        if (!originalRequest._isRetry && error.message === 'jwt expired') {
            originalRequest._isRetry = true

            try {
                await echoAuth.request(originalRequest)
                return error
            } catch (err) {
                // В этом случае ошибка отдастся на самый верх, перехватчики не обрабатывают ошибки друг друга
                throw err
            }
        }
    }
    return error
  }
)
```

## Удаление и очистка перехватчиков

- instance.interceptors.request.eject('auth') — удалить перехватчик с ключом 'auth'.
- instance.interceptors.request.clear() — удалить все request перехватчики.

## Вопросы и обратная связь

Если у вас возникнут вопросы, пожелания или вы найдёте ошибку, напишите нам на help.yai.team@gmail.com. Будем рады вашему вкладу в виде pull request!

## Лицензия

Проект распространяется под лицензией [MIT].
