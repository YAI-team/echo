# @yai/echo

**@yai/echo** — это лёгкий HTTP-клиент на основе встроенного `fetch`, с удобным синтаксисом, напоминающим [Axios](https://github.com/axios/axios). Библиотека поддерживает перехватчики (interceptors) для запросов и ответов, что облегчает добавление заголовков, обработку ошибок, логирование и другие аспекты работы с сетью.

## Установка

```bash
# using npm
$ npm install @yai/echo
# or using yarn
$ yarn add @yai/echo
# or using bun
$ bun add @yai/echo
```

## Быстрый старт

После установки можно сразу использовать дефолтный экземпляр:

```bash
import echo from '@yai/echo'

// Get запрос с then
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

// Post запрос без then
const response = await echo.post('/login', { username: 'admin', password: '123456' })
```

## Методы запроса

Экземпляр (или echo по умолчанию) поддерживает методы:

- `request(config)`
- `get(url, options?)`
- `post(url, body?, options?)`
- `put(url, body?, options?)`
- `patch(url, body?, options?)`
- `delete(url, options?)`

Где:

- url — строка, указывающая на endpoint (если есть baseURL, то будет к нему добавляться).
- body — тело запроса для методов, позволяющих передавать данные (POST, PUT, PATCH).
- options — дополнительная конфигурация (заголовки, responseType, params и т.д.).

## Создание экземпляра и базовая конфигурация

Пример создание экземпляра:

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

// После чего можем использовать echoBase как обычный echo
const response = await echoBase.get('/users')
```

Кроме того стоит учесть что в обычном echo не созданном с помощью create нету поддержки перехватчиков.
Вы так же можете создать минимизированную версию echo, которая по сути является просто оберткой для fetch:

```bash
// Тут берем config созданный выше
const echoServer = new EchoClient(config)
```

Это может пригодиться для запросов в middleware которые обычно не требуют перехватчиков или другой логики:

```bash
const echoServer = (
	refreshToken?: string,
	accessToken?: string
): EchoClientInstance =>
	new EchoClient({
        // Тут берем config созданный выше
		...config,
		headers: {
			...(refreshToken && { Cookie: REFRESH(refreshToken) }),
			...(accessToken && { Authorization: BEARER(accessToken) })
		}
	})
```

## Request Config

Это доступные параметры конфигурации для выполнения запросов:

```bash
{
    // Предшественник `url`
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

## Response Schema

Ответ на запрос содержит следующую информацию:

```bash
{
    // Is the response that was provided by the server.
    data: {},

    // Is the HTTP status code from the server response.
    status: 200,

    // Is the HTTP status message from the server response.
    statusText: 'OK',

    // Is the HTTP headers that the server responded with.
    headers: {},

    // Это конфигурация заданная пользователем.
    config: {},

    // Это конечный экземпляр запроса, может меняться от перехватчиков или механизмов валидации.
    request: {}
}
```

При использовании then вы получите следующий ответ:

```bash
echoBase.get('/users')
    .then(response => {
        console.log(response.data)
        console.log(response.status)
        console.log(response.statusText)
        console.log(response.headers)
        console.log(response.config)
        console.log(response.request)
    })
```

## Перехватчики

@yai/echo поддерживает два типа перехватчиков:

- request — вызывается до выполнения запроса или при ошибке запроса.
- response — вызывается после получения ответа или при ошибке ответа.

Оба типа перехватчиков могут влиять на дальнейший ход запроса/ответа.

## Добавление перехватчика

Перехватчики выполняются в порядке добавления: `request` -- `reject request` -- `response` -- `reject response`.
Ключи `request` и `response` перехватчиков не конфликтуют, так что вы можете давать им одинаковые названия.

> Если отдать ошибку EchoError в перехватчиках `request` ее отловит `reject response`

```bash
const echoAuth = echo.create({ baseURL: 'https://api.example.com' })

// Добавим перехватчик request.
echoAuth.interceptors.request.use(
    'auth',
    config => {
        // Если вдруг тут возникнет ошибка ее перехватят в reject request.

        // Изменяем заголовки для авторизации.
        config.headers = {
            ...config.headers,
            Authorization: 'Bearer myToken'
        }

        // Всегда возвращайте результат для других перехватчиков.
        return config
    },
    error => {
        // Можно перехватить ошибку, связанную с формированием запроса,
        // В такие ошибки как правило попадает все что не относится к ответу fetch.

        if (isEchoError(error)) {
            // Всегда будет false
        }

        // Всегда возвращайте результат для других перехватчиков.
         // Если возврать не ошибку то другие перехватчики ошибок не будут отрабатывать.
        return error
    }
)

// Добавим перехватчик response.
echoAuth.interceptors.response.use(
    'auth',
    response => {
        // Можно модифицировать ответ.
        console.log('Response data:', response.data)

        // Если вдруг тут возникнет ошибка ее перехватят в response request

        // Всегда возвращайте результат для других перехватчиков.
        return response
    },
    error => {
        // Можно вернуть свой "фейковый" ответ и считать ошибку обработанной.

        if (isEchoError(error)) {
            const originalRequest: any = error.request

            if (!originalRequest._isRetry && error.message === 'jwt expired') {
                // Это мутирует request, будьте аккуратны
                originalRequest._isRetry = true

                try {
                    await echoAuth.request(originalRequest)
                    return error
                } catch (err) {
                    // В этом случае ошибка отдастся на самый верх.
                    // Перехватчики ошибок не обрабатывают ошибки друг друга.
                    //
                    throw err
                }
            }
        }

        // Всегда возвращайте результат для других перехватчиков.
        // Если возврать не ошибку то другие перехватчики ошибок не будут отрабатывать.
        return error
    }
)
```

Объект config в response рассчитывался как неизменяемый (устанавливается пользователем на входе), не стоит его изменять (это не опасно, но не стоит).
При необходимости в response изменяйте именно request, после запроса он не влечет полезную нагрузку кроме как логирования (не задумывался таковым).

## Удаление и очистка перехватчиков

- `instance.interceptors.request.eject('auth')` — удалить перехватчик с ключом 'auth'.
- `instance.interceptors.request.clear()` — удалить все request перехватчики.

## Обработка ошибок

Экземпляр EchoError содержит:

```bash
{
    // Сообщения ошибки
    message: string,

    // Конфигурацию запроса
    config: EchoConfig,

    // Конечный экземпляр запроса
    request: EchoRequest,

    // Экземпляр ответа
    response?: EchoResponse
}
```

Пример обработки ошибки:

```bash
echo.get('/user/12345')
    .catch(error => {
		console.log('Error', error.message)
		// Конфигурация запроса
		console.log(error.config)

		// Конечная конфигурация запроса
		console.log(error.request)

		// Сервер ответил на запрос с кодом выходящим за 2xx
		if (error.response) {
			console.log(error.response.data)
			console.log(error.response.status)
			console.log(error.response.headers)
		}
	})
```

Однако стоит учесть что echo не всегда может обеспечить вывод ошибки в виде EchoError, поскольку вы можете их переопределять в перехватчиках.

Вы так же можете проверять ошибку на EchoError с помощью:

```bash
echo.get('/user/12345')
	.catch(error => {
		if (isEchoError(error)) {
			// Это по прежнему EchoError
		}
	})
```

## Использование multipart/form-data формата

Для отправки **FormData** вам необязательно использовать заголовки, echo автоматически удалит Content-type после чего fetch подставит нужный заголовок.

## TypeScript & ES6

Echo полностью типизирован кроме того он не рассчитан на использование версий ниже JavaScript ES6

## Вопросы и обратная связь

Если у вас возникнут вопросы, пожелания или вы найдёте ошибку, напишите нам на help.yai.team@gmail.com

## Лицензия

Проект распространяется под лицензией [MIT](./LICENSE).
