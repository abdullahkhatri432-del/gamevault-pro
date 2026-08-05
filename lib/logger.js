const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, context = {}) {
  const entry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...context,
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function logError(message, context = {}) {
  log('error', message, context);
}

export function logWarn(message, context = {}) {
  log('warn', message, context);
}

export function logInfo(message, context = {}) {
  log('info', message, context);
}

export function logDebug(message, context = {}) {
  log('debug', message, context);
}

export function logApiError(route, error, context = {}) {
  logError(`API error in ${route}`, {
    route,
    error: error?.message || String(error),
    stack: error?.stack,
    ...context,
  });
}
