const util = require('../util')
const jsesc = require('jsesc')

const toBrowser = curlCommand => {
  const request = util.parseCurlCommand(curlCommand)

  let browserCode = ''

  if (request.data === true) {
    request.data = ''
  }
  if (request.data) {
    if (typeof request.data === 'number') {
      request.data = request.data.toString()
    }
    // escape single quotes if there are any in there
    if (request.data.indexOf("'") > -1) {
      request.data = jsesc(request.data)
    }

    try {
      JSON.parse(request.data)

      if (!request.headers) {
        request.headers = {}
      }

      if (!request.headers['Content-Type']) {
        request.headers['Content-Type'] = 'application/json; charset=UTF-8'
      }

      request.data = 'JSON.stringify(' + request.data + ')'
    } catch {
      request.data = '\'' + request.data + '\''
    }
  }

  browserCode += 'fetch(\'' + request.url + '\''

  if (request.method !== 'get' || request.headers || request.cookies || request.auth || request.body) {
    browserCode += ', {\n'

    if (request.method !== 'get') {
      browserCode += '    method: \'' + request.method.toUpperCase() + '\''
    }

    if (request.headers || request.cookies || request.auth) {
      if (request.method !== 'get') {
        browserCode += ',\n'
      }
      browserCode += '    headers: {\n'
      const headerCount = Object.keys(request.headers || {}).length
      let i = 0
      for (const headerName in request.headers) {
        browserCode += '        \'' + headerName + '\': \'' + request.headers[headerName] + '\''
        if (i < headerCount - 1 || request.cookies || request.auth) {
          browserCode += ',\n'
        }
        i++
      }
      if (request.auth) {
        const splitAuth = request.auth.split(':')
        const user = splitAuth[0] || ''
        const password = splitAuth[1] || ''
        browserCode += '        \'Authorization\': \'Basic \' + btoa(\'' + user + ':' + password + '\')'
      }
      if (request.cookies) {
        const cookieString = util.serializeCookies(request.cookies)
        browserCode += '        \'Cookie\': \'' + cookieString + '\''
      }

      browserCode += '\n    }'
    }

    if (request.data) {
      browserCode += ',\n    body: ' + request.data
    }

    browserCode += '\n}'
  }

  browserCode += ');'

  return browserCode + '\n'
}

module.exports = toBrowser
