<p align="center">
	<a href="https://github.com/YAI-team/echo/" target="blank">
		<img src="https://raw.githubusercontent.com/YAI-team/echo/main/public/favicon.svg" width="500" alt="Project Logo" />
	</a>
</p>

## Description

This is a lightweight HTTP client based on the built-in `fetch`, featuring a convenient syntax similar to [Axios](https://github.com/axios/axios). The library supports interceptors for requests and responses, making it easier to add headers, handle errors, log requests, and manage other networking aspects.

## Installation

```bash
# using npm
$ npm install @yai/echo
# or using yarn
$ yarn add @yai/echo
# or using bun
$ bun add @yai/echo
```

## Quick Start

After installation, you can use the default instance immediately:

```javascript
import echo from '@yai/echo'

// GET request with then
echo.get('/users')
	.then(response => {
		// handle success
		console.log(response.data)
	})
	.catch(function (error) {
		// handle error
		console.log(error)
	})
	.finally(function () {
		// always executed
	})

// POST request without then
const response = await echo.post('/login', {
	username: 'admin',
	password: '123456'
})
```

## Request Methods

The instance (or the default `echo`) supports the following methods:

- `request(config)`
- `get(url, options?)`
- `post(url, body?, options?)`
- `put(url, body?, options?)`
- `patch(url, body?, options?)`
- `delete(url, options?)`

Where:

- `url` — A string indicating the endpoint (if `baseURL` is set, it will be prepended).
- `body` — The request body for methods that allow sending data (POST, PUT, PATCH).
- `options` — Additional configuration (headers, responseType, params, etc.).

## Creating an Instance and Base Configuration

Example of creating an instance:

```javascript
import echo from '@yai/echo'

// Define configuration
const config: EchoCreateConfig = {
	baseURL: 'http://localhost:4200',
	headers: {
		'Content-Type': 'application/json'
    	},
	credentials: 'include'
}

// Create an Echo instance
const echoBase = echo.create(config)

// Now you can use `echoBase` just like `echo`
const response = await echoBase.get('/users')
```

Note that the default `echo` instance (not created with `create`) does not support interceptors.

You can also create a minimal version of `echo`, which essentially acts as a simple wrapper around `fetch`:

```javascript
// Using the previously defined config
const echoServer = new EchoClient(config)
```

This can be useful for middleware requests that usually do not require interceptors or additional logic:

```javascript
const echoServer = (
	refreshToken?: string,
    accessToken?: string
): EchoClientInstance =>
	new EchoClient({
        // Using the previously defined config
        ...config,
        headers: {
            ...(refreshToken && { Cookie: REFRESH(refreshToken) }),
            ...(accessToken && { Authorization: BEARER(accessToken) })
        }
    })
```

## Request Config

These are the available configuration parameters for making requests:

```javascript
{
    // Predecessor of `url`
    baseURL: 'https://api.example.com',

    // The URL of the server to be used for the request
    url: '/user',

    // The request method to be used
    method: 'get',

    // Headers object
    headers: { 'Content-Type': 'application/json' },

    // URL parameters to be sent with the request
    params: { limit: 10 },

    // The expected response data type (e.g., 'json' | 'text' | 'blob' | 'formData' | ...)
    responseType: json, // default

    // Other fields supported by fetch.
}
```

## Response Schema

A response object contains the following information:

```javascript
{
	// The response data provided by the server.
	data: {},

	// The HTTP status code from the server response.
	status: 200,

	// The HTTP status message from the server response.
	statusText: 'OK',
	
	// The HTTP headers returned by the server.
	headers: {},
	
	// The user-defined request configuration.
	config: {},
	
	// The final request instance, which may be modified by interceptors or validation mechanisms.
	request: {}
}
```

When using `then`, you get the following response:

```javascript
echoBase.get('/users').then(response => {
	console.log(response.data)
	console.log(response.status)
	console.log(response.statusText)
	console.log(response.headers)
	console.log(response.config)
	console.log(response.request)
})
```

## Interceptors

@yai/echo supports two types of interceptors:

- `request` — Called before making the request or in case of a request error.
- `response` — Called after receiving the response or in case of a response error.

Both types of interceptors can affect the request/response flow.

### Adding an Interceptor

Interceptors are executed in the following order: `request` → `reject request` → `response` → `reject response`.
The `request` and `response` keys do not conflict, so you can use the same names for them.

> If an `EchoError` is thrown inside a `request` interceptor, it will be caught by `reject response`.

```javascript
const echoAuth = echo.create({ baseURL: 'https://api.example.com' })

// Add a request interceptor
echoAuth.interceptors.request.use(
	'auth',
	config => {
		// Modify authorization headers
		config.headers = {
			...config.headers,
			Authorization: 'Bearer myToken'
		}
		return config
	},
	error => {
		return error
	}
)

// Add a response interceptor
echoAuth.interceptors.response.use(
	'auth',
	response => {
		console.log('Response data:', response.data)
		return response
	},
	error => {
		return error
	}
)
```

## Removing and Clearing Interceptors

- `instance.interceptors.request.eject('auth')` — Removes the interceptor with the key 'auth'.
- `instance.interceptors.request.clear()` — Removes all request interceptors.

## Error Handling

An `EchoError` instance contains:

```javascript
{
	// Error message
	message: string,
	
	// Request configuration
	config: EchoConfig,
	
	// Final request instance
	request: EchoRequest,
	
	// Response instance (if available)
	response?: EchoResponse
}
```

Example error handling:

```javascript
echo.get('/user/12345').catch(error => {
	console.log('Error', error.message)
	console.log(error.config)
	console.log(error.request)

	if (error.response) {
		console.log(error.response.data)
		console.log(error.response.status)
		console.log(error.response.headers)
	}
})
```

## Using multipart/form-data

When sending **FormData**, you do not need to set headers manually; `echo` will automatically remove `Content-Type`, allowing `fetch` to apply the appropriate header.

## TypeScript & ES6

Echo is fully typed and is designed for JavaScript ES6 and higher.

## Questions and Feedback

If you have any questions, suggestions, or find a bug, contact us at help.yai.team@gmail.com.

## License

This project is distributed under the [MIT license](./LICENSE).
